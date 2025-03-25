import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/authService';
import { insertUserSchema } from '@shared/schema';
import { authenticate, hasRole } from '../middleware/auth';
import { storage } from '../storage';

const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const registrationSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6)
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = registrationSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Check if username is taken
    const existingUsername = await storage.getUserByUsername(validatedData.username);
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    
    // Register user using hybrid approach
    let user;
    
    try {
      // Try to register with Supabase first
      user = await authService.registerSupabaseUser(
        validatedData.email,
        validatedData.password,
        {
          username: validatedData.username,
          fullName: validatedData.fullName,
          role: validatedData.role,
          bio: validatedData.bio,
          avatar: validatedData.avatar,
          skills: validatedData.skills,
          hourlyRate: validatedData.hourlyRate,
          location: validatedData.location
        }
      );
    } catch (supabaseError) {
      console.error('Supabase registration failed, falling back to local:', supabaseError);
      
      // Fall back to local registration
      // Create a new object without confirmPassword
      const { confirmPassword, ...userData } = validatedData;
      user = await authService.registerLocalUser(userData);
    }
    
    if (!user) {
      return res.status(500).json({ error: 'Failed to register user' });
    }
    
    // Create a session for the new user
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || '';
    const session = await authService.createSession(user.id, userAgent, ipAddress);
    
    // Return user (without password) and token
    const { password, ...userWithoutPassword } = user;
    
    res.status(201).json({
      user: userWithoutPassword,
      token: session.token,
      expiresAt: session.expiresAt
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Debug incoming request
    console.log('Raw request body:', JSON.stringify(req.body));
    console.log('Parsed request body after middleware:', req.body);
    
    // Get email and password from req.body (email field might be called username in some requests)
    const userEmail = req.body?.email || req.body?.username;
    const userPass = req.body?.password;
    
    // Debug request body again
    console.log('Login data received:', { 
      email: userEmail ? `${userEmail.slice(0,3)}...` : 'missing',
      password: userPass ? '******' : 'missing'
    });
    
    // Check if email/password are present
    if (!userEmail || !userPass) {
      console.log('Login validation failed - missing credentials');
      return res.status(400).json({ 
        message: 'Email/username and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }
    
    // Additional debug logging
    console.log(`Login attempt - Validated email: ${userEmail}`);
    console.log(`Request body keys: ${Object.keys(req.body).join(', ')}`);
    console.log(`Request headers:`, req.headers);
    
    console.log(`Attempting login for email: ${userEmail.slice(0, 3)}...`);
    
    // Get user agent and IP for tracking
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || '';
    
    // Attempt hybrid login
    const authResult = await authService.hybridLogin(
      userEmail,
      userPass,
      userAgent,
      ipAddress
    );
    
    if (!authResult) {
      console.log('Login failed - invalid credentials');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Remove password from user object
    const { password: _, ...userWithoutPassword } = authResult.user;
    
    // Set session cookie if using local auth
    if (authResult.authProvider === 'local' && authResult.token) {
      res.cookie('session', authResult.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict'
      });
    }
    
    // Return user data and tokens
    res.json({
      user: userWithoutPassword,
      token: authResult.token,
      supabaseToken: authResult.supabaseToken,
      expiresAt: authResult.expiresAt,
      authProvider: authResult.authProvider
    });
  } catch (error: any) {
    console.error('Login error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout a user
 * @access Private
 */
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  try {
    // Clear session cookie
    res.clearCookie('session');
    
    // Return success response
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

/**
 * @route GET /api/auth/me
 * @desc Get current user
 * @access Private
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Remove password from user object
    const { password, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

/**
 * @route POST /api/auth/setup-test-users
 * @desc Create test users for all roles (development only)
 * @access Admin
 */
router.post('/setup-test-users', authenticate, hasRole(['admin']), async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }
  
  try {
    const roles = ['client', 'freelancer', 'admin', 'support', 'qa', 'dispute_resolution', 'accounts'];
    const users = [];
    
    for (const role of roles) {
      const user = await authService.createTestAccount(role);
      if (user) {
        const { password, ...userWithoutPassword } = user;
        users.push(userWithoutPassword);
      }
    }
    
    res.json({ message: 'Test users created', users });
  } catch (error) {
    console.error('Setup test users error:', error);
    res.status(500).json({ error: 'Failed to create test users' });
  }
});

export default router;