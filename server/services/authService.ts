import { createClient } from '@supabase/supabase-js';
import { randomBytes, createHash } from 'crypto';
import { storage } from '../storage';
import { insertUserSchema, userSessions, type InsertUser, User, auditLogs } from '@shared/schema';
import { eq } from 'drizzle-orm';

// JWT Secret (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || randomBytes(32).toString('hex');
const JWT_EXPIRY = '24h';

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabase: any = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Hashes a password using SHA-256
 * @param password The plain text password
 * @returns Hashed password
 */
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

/**
 * Verifies a password against the hashed version
 * @param plainPassword The plain text password to verify
 * @param hashedPassword The hashed password to compare against
 * @returns True if the password matches
 */
function verifyPassword(plainPassword: string, hashedPassword: string): boolean {
  const hashedInput = hashPassword(plainPassword);
  return hashedInput === hashedPassword;
}

/**
 * Generates a JWT token for a user
 * @param user The user to generate a token for
 * @returns JWT token
 */
function generateToken(user: User): string {
  // Basic token generation without jwt library
  const payload = {
    sub: user.id.toString(),
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = createHash('sha256')
    .update(encodedPayload + JWT_SECRET)
    .digest('base64');
  
  return `${encodedPayload}.${signature}`;
}

/**
 * Verifies a JWT token and returns the payload
 * @param token The JWT token to verify
 * @returns The decoded token payload or null if invalid
 */
function verifyToken(token: string): any {
  try {
    const [encodedPayload, signature] = token.split('.');
    
    const expectedSignature = createHash('sha256')
      .update(encodedPayload + JWT_SECRET)
      .digest('base64');
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64').toString());
    
    // Check if token is expired
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Creates a user session
 * @param userId The user ID
 * @param userAgent The user agent
 * @param ipAddress The IP address
 * @returns The created session
 */
async function createSession(userId: number, userAgent: string = '', ipAddress: string = ''): Promise<{ 
  token: string;
  expiresAt: Date;
}> {
  try {
    // Generate a random token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1); // 1 day expiry
    
    // Save session in database
    await storage.db.insert(userSessions).values({
      userId,
      token,
      expiresAt,
      userAgent,
      ipAddress,
      lastActivity: new Date(),
      createdAt: new Date()
    });
    
    return { token, expiresAt };
  } catch (error) {
    console.error('Error creating session:', error);
    throw new Error('Failed to create session');
  }
}

/**
 * Validates a user session
 * @param token The session token
 * @returns The user ID if valid, null otherwise
 */
async function validateSession(token: string): Promise<number | null> {
  try {
    const session = await storage.db.query.userSessions.findFirst({
      where: eq(userSessions.token, token)
    });
    
    if (!session) {
      return null;
    }
    
    // Check if session is expired
    if (new Date() > session.expiresAt) {
      // Delete expired session
      await storage.db.delete(userSessions).where(eq(userSessions.token, token));
      return null;
    }
    
    // Update last activity
    await storage.db.update(userSessions)
      .set({ lastActivity: new Date() })
      .where(eq(userSessions.token, token));
    
    return session.userId;
  } catch (error) {
    console.error('Error validating session:', error);
    return null;
  }
}

/**
 * Registers a new user with local authentication
 * @param userData User data for registration
 * @returns The created user
 */
async function registerLocalUser(userData: InsertUser): Promise<User> {
  try {
    // Validate user data
    const validatedData = insertUserSchema.parse(userData);
    
    // Hash the password
    const hashedPassword = hashPassword(validatedData.password);
    
    // Create user in our database
    const user = await storage.createUser({
      ...validatedData,
      password: hashedPassword
    });
    
    return user;
  } catch (error) {
    console.error('Error in local registration:', error);
    throw error;
  }
}

/**
 * Registers a user with Supabase auth
 * @param email Email for registration
 * @param password Password for registration
 * @param userData Additional user data
 * @returns The created user or null if failed
 */
async function registerSupabaseUser(
  email: string, 
  password: string,
  userData: Omit<InsertUser, 'email' | 'password'>
): Promise<User | null> {
  if (!supabase) {
    throw new Error('Supabase is not initialized');
  }
  
  try {
    // Register with Supabase first
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: userData.username,
          full_name: userData.fullName,
          role: userData.role
        }
      }
    });
    
    if (error) {
      throw error;
    }
    
    if (!data?.user) {
      return null;
    }
    
    // Create the user in our database as well
    const supabaseId = data.user.id;
    const user = await registerLocalUser({
      ...userData,
      email,
      password // This will be hashed in the function
    });
    
    return user;
  } catch (error) {
    console.error('Error in Supabase registration:', error);
    throw error;
  }
}

/**
 * Logs in a user with local authentication
 * @param email User email
 * @param password User password (plain text)
 * @param userAgent User agent from request
 * @param ipAddress IP address from request
 * @returns User object and token if successful
 */
async function loginLocal(
  email: string, 
  password: string,
  userAgent: string = '',
  ipAddress: string = ''
): Promise<{ user: User; token: string; expiresAt: Date } | null> {
  try {
    // Look up user by email
    const user = await storage.getUserByEmail(email);
    
    if (!user) {
      return null;
    }
    
    // Verify password
    const isValid = verifyPassword(password, user.password);
    
    if (!isValid) {
      return null;
    }
    
    // Create session
    const session = await createSession(user.id, userAgent, ipAddress);
    
    // Update last login timestamp
    await storage.updateUser(user.id, { lastLogin: new Date() });
    
    // Log the authentication event
    await storage.db.insert(auditLogs).values({
      userId: user.id,
      action: 'authentication',
      resource: 'session',
      detail: { method: 'local' },
      ipAddress,
      userAgent,
      createdAt: new Date()
    });
    
    return { 
      user,
      token: session.token,
      expiresAt: session.expiresAt 
    };
  } catch (error) {
    console.error('Error in local login:', error);
    return null;
  }
}

/**
 * Logs in a user with Supabase authentication
 * @param email User email
 * @param password User password
 * @param userAgent User agent from request
 * @param ipAddress IP address from request
 * @returns User object and token if successful
 */
async function loginSupabase(
  email: string, 
  password: string,
  userAgent: string = '',
  ipAddress: string = ''
): Promise<{ user: User; token: string; supabaseToken?: string } | null> {
  if (!supabase) {
    return null;
  }
  
  try {
    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error || !data.user) {
      return null;
    }
    
    // Check if user exists in our database
    let user = await storage.getUserByEmail(email);
    
    // If no user in our database, try to create one
    if (!user) {
      const { data: userData } = await supabase.auth.getUser(data.session.access_token);
      
      if (userData?.user) {
        const supabaseUser = userData.user;
        
        try {
          // Create user in our database
          user = await storage.createUser({
            email: supabaseUser.email!,
            username: supabaseUser.user_metadata?.username || supabaseUser.email!.split('@')[0],
            password: hashPassword(randomBytes(16).toString('hex')), // random password
            fullName: supabaseUser.user_metadata?.full_name || '',
            role: supabaseUser.user_metadata?.role || 'freelancer',
            bio: supabaseUser.user_metadata?.bio,
            avatar: supabaseUser.user_metadata?.avatar_url,
            skills: supabaseUser.user_metadata?.skills || [],
            hourlyRate: supabaseUser.user_metadata?.hourly_rate || null,
            location: supabaseUser.user_metadata?.location
          });
        } catch (createError) {
          console.error('Error creating user from Supabase:', createError);
          return null;
        }
      }
    }
    
    if (!user) {
      return null;
    }
    
    // Create JWT token
    const token = generateToken(user);
    
    // Update last login timestamp
    await storage.updateUser(user.id, { lastLogin: new Date() });
    
    return { 
      user, 
      token,
      supabaseToken: data.session?.access_token
    };
  } catch (error) {
    console.error('Error in Supabase login:', error);
    return null;
  }
}

/**
 * Hybrid authentication function that tries both local and Supabase auth
 * @param email User email
 * @param password User password 
 * @param userAgent User agent for session tracking
 * @param ipAddress IP address for session tracking
 * @returns Authentication result with user and tokens
 */
async function hybridLogin(
  email: string,
  password: string,
  userAgent: string = '',
  ipAddress: string = ''
): Promise<{ 
  user: User; 
  token: string; 
  expiresAt?: Date;
  supabaseToken?: string; 
  authProvider: 'local' | 'supabase';
} | null> {
  // Try local auth first
  const localAuthResult = await loginLocal(email, password, userAgent, ipAddress);
  
  if (localAuthResult) {
    return {
      ...localAuthResult,
      authProvider: 'local'
    };
  }
  
  // If local auth fails, try Supabase
  if (supabase) {
    const supabaseAuthResult = await loginSupabase(email, password, userAgent, ipAddress);
    
    if (supabaseAuthResult) {
      return {
        ...supabaseAuthResult,
        authProvider: 'supabase'
      };
    }
  }
  
  // Both authentication methods failed
  return null;
}

/**
 * Creates a test account for demonstration purposes
 * @param role The role for the test account
 * @returns The created user
 */
async function createTestAccount(role: string): Promise<User | null> {
  try {
    const testAccount = {
      email: `${role}@example.com`,
      username: role,
      password: 'password123',
      fullName: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
      role: role as any,
    };
    
    // Check if account already exists
    const existingUser = await storage.getUserByEmail(testAccount.email);
    if (existingUser) {
      return existingUser;
    }
    
    // Create the account
    const hashedPassword = hashPassword(testAccount.password);
    const user = await storage.createUser({
      ...testAccount,
      password: hashedPassword
    });
    
    return user;
  } catch (error) {
    console.error(`Error creating test ${role} account:`, error);
    return null;
  }
}

export const authService = {
  registerLocalUser,
  registerSupabaseUser,
  loginLocal,
  loginSupabase,
  hybridLogin,
  verifyPassword,
  generateToken,
  verifyToken,
  createSession,
  validateSession,
  createTestAccount,
  hashPassword
};