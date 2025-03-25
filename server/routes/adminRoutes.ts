import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { authenticate, hasRole } from '../middleware/auth';
import { authService } from '../services/authService';
import { insertUserSchema } from '@shared/schema';

const router = Router();

// Create validation schemas
const createUserSchema = insertUserSchema.extend({
  password: z.string().min(6).optional() // Password is optional, will be auto-generated if not provided
});

const updateUserSchema = z.object({
  fullName: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(['client', 'freelancer', 'admin', 'support', 'qa', 'dispute_resolution', 'accounts']).optional(),
  bio: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
  skills: z.array(z.string()).nullable().optional(),
  hourlyRate: z.number().nullable().optional(),
  location: z.string().nullable().optional(),
  active: z.boolean().optional()
});

const passwordResetSchema = z.object({
  userId: z.number(),
  newPassword: z.string().min(6).optional() // If not provided, a random one will be generated
});

/**
 * @route GET /api/admin/users
 * @desc Get all users
 * @access Admin
 */
router.get('/users', authenticate, hasRole(['admin']), async (req: Request, res: Response) => {
  try {
    // Add pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    // Get users with pagination
    const users = await storage.getAllUsers(limit, offset);
    
    // Remove passwords from response
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    // Get total count for pagination
    const totalCount = await storage.getUserCount();
    
    res.json({
      users: usersWithoutPasswords,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * @route GET /api/admin/users/:id
 * @desc Get user by ID
 * @access Admin
 */
router.get('/users/:id', authenticate, hasRole(['admin']), async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * @route POST /api/admin/users
 * @desc Create a new user
 * @access Admin
 */
router.post('/users', authenticate, hasRole(['admin']), async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = createUserSchema.parse(req.body);
    
    // Check if email already exists
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    // Check if username already exists
    if (validatedData.username) {
      const existingUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUsername) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }
    
    // Generate password if not provided
    const password = validatedData.password || Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + '!';
    
    // Hash the password
    const hashedPassword = authService.hashPassword(password);
    
    // Create the user
    const user = await storage.createUser({
      ...validatedData,
      password: hashedPassword
    });
    
    // Remove password from the response
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(201).json({
      user: userWithoutPassword,
      generatedPassword: validatedData.password ? undefined : password // Only return generated password
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * @route PUT /api/admin/users/:id
 * @desc Update user
 * @access Admin
 */
router.put('/users/:id', authenticate, hasRole(['admin']), async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Validate request body
    const validatedData = updateUserSchema.parse(req.body);
    
    // Check if user exists
    const existingUser = await storage.getUser(userId);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If email is being updated, check if it's already in use
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await storage.getUserByEmail(validatedData.email);
      if (emailExists) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }
    
    // Update the user
    const updatedUser = await storage.updateUser(userId, validatedData);
    
    if (!updatedUser) {
      return res.status(500).json({ error: 'Failed to update user' });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.json(userWithoutPassword);
  } catch (error: any) {
    console.error('Error updating user:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * @route POST /api/admin/users/:id/reset-password
 * @desc Reset user password
 * @access Admin
 */
router.post('/users/:id/reset-password', authenticate, hasRole(['admin']), async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Validate request body
    const validatedData = passwordResetSchema.parse({ ...req.body, userId });
    
    // Check if user exists
    const existingUser = await storage.getUser(userId);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate new password if not provided
    const newPassword = validatedData.newPassword || Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + '!';
    
    // Hash the new password
    const hashedPassword = authService.hashPassword(newPassword);
    
    // Update user password
    const updatedUser = await storage.updateUser(userId, { password: hashedPassword });
    
    if (!updatedUser) {
      return res.status(500).json({ error: 'Failed to reset password' });
    }
    
    res.json({
      message: 'Password reset successful',
      newPassword: validatedData.newPassword ? undefined : newPassword // Only return generated password
    });
  } catch (error: any) {
    console.error('Error resetting password:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors });
    }
    
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

/**
 * @route DELETE /api/admin/users/:id
 * @desc Delete user (or deactivate)
 * @access Admin
 */
router.delete('/users/:id', authenticate, hasRole(['admin']), async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Option to soft delete (deactivate) instead of hard delete
    const softDelete = req.query.softDelete === 'true';
    
    if (softDelete) {
      // Soft delete - just update the status to inactive
      const updatedUser = await storage.updateUser(userId, { active: false });
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      return res.json({ message: 'User deactivated successfully' });
    } else {
      // Hard delete - remove user from database
      const result = await storage.deleteUser(userId);
      
      if (!result) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      return res.json({ message: 'User deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;