import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { storage } from '../storage';

/**
 * Middleware to authenticate requests using JWT tokens
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for token in authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;
      
    console.debug('Auth middleware - Headers:', { 
      auth: req.headers.authorization,
      sessionCookie: req.cookies?.session,
      sessionHeader: req.headers['session-token']
    });
    
    if (!token) {
      // If no token in authorization header, check for session token
      const sessionToken = req.cookies?.session || req.headers['session-token'] as string;
      
      if (!sessionToken) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      // Validate session token
      const userId = await authService.validateSession(sessionToken);
      
      if (!userId) {
        return res.status(401).json({ message: 'Invalid or expired session' });
      }
      
      // Get user
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      console.debug('Auth middleware - Session authentication successful for user:', userId);
      
      // Set user on request
      (req as any).user = user;
      return next();
    }
    
    // Verify JWT token
    const decoded = authService.verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    console.debug('Auth middleware - JWT verification successful for subject:', decoded.sub);
    
    // Get user from database
    const user = await storage.getUser(Number(decoded.sub));
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    console.debug('Auth middleware - JWT authentication successful for user:', user.id);
    
    // Set user on request
    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

/**
 * Middleware to check if user has required role
 * @param roles Array of allowed roles
 */
export const hasRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    console.debug('Role check - User role:', user.role, 'Required roles:', roles);
    
    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    next();
  };
};

/**
 * Middleware to check if user has specific permission
 * @param permissions Array of required permissions
 */
export const hasPermission = (permissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // For admins, bypass permission check
    if (user.role === 'admin') {
      console.debug('Permission check - Admin bypass for user:', user.id);
      return next();
    }
    
    // Check if user has the required permissions
    // This requires that user has a permissions field that is a JSON array
    const userPermissions = user.permissions || [];
    console.debug('Permission check - User permissions:', userPermissions, 'Required permissions:', permissions);
    
    const hasAllPermissions = permissions.every(permission => 
      userPermissions.includes(permission)
    );
    
    if (!hasAllPermissions) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    next();
  };
};