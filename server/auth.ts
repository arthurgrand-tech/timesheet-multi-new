import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { platformStorage, createTenantStorage } from './storage';
import { type PlatformUser, type User } from '@shared/schema';

// JWT Secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Extended Request interfaces
export interface AuthenticatedPlatformRequest extends Request {
  user?: PlatformUser;
}

export interface AuthenticatedTenantRequest extends Request {
  user?: User;
  tenant?: {
    id: number;
    subdomain: string;
    connectionString: string;
  };
}

// ==================== UTILITY FUNCTIONS ====================

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 12);
};

export const comparePasswords = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateToken = (payload: any): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET);
};

// ==================== AUTHENTICATION MIDDLEWARE ====================

// Platform-level authentication (for Super Admin and Product Owner)
export const authenticatePlatformUser = async (
  req: AuthenticatedPlatformRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.cookies?.platformToken;

    if (!token) {
      res.status(401).json({ message: 'Access token required' });
      return;
    }

    const decoded = verifyToken(token);
    const user = await platformStorage.getPlatformUser(decoded.userId);

    if (!user || !user.isActive) {
      res.status(401).json({ message: 'Invalid or inactive user' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// THIS IS FOR TEST
// export const authenticatePlatformUser = async (
//   req: AuthenticatedPlatformRequest,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     // Allow unauthenticated access to login endpoint
//     if (req.path === '/api/platform/auth/login') {
//       return next();
//     }

//     const authHeader = req.headers.authorization;
//     const token = authHeader && authHeader.startsWith('Bearer ') 
//       ? authHeader.substring(7) 
//       : req.cookies?.platformToken;

//     if (!token) {
//       res.status(401).json({ message: 'Access token required' });
//       return;
//     }

//     const decoded = verifyToken(token);
//     const user = await platformStorage.getPlatformUser(decoded.userId);

//     if (!user || !user.isActive) {
//       res.status(401).json({ message: 'Invalid or inactive user' });
//       return;
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     res.status(401).json({ message: 'Invalid token' });
//   }
// };

// Tenant-level authentication (for tenant users)
export const authenticateTenantUser = async (
  req: AuthenticatedTenantRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.cookies?.tenantToken;

    if (!token) {
      res.status(401).json({ message: 'Access token required' });
      return;
    }

    const decoded = verifyToken(token);
    
    // Get tenant information
    const tenant = await platformStorage.getTenant(decoded.tenantId);
    if (!tenant || tenant.status !== 'active') {
      res.status(401).json({ message: 'Invalid or inactive tenant' });
      return;
    }

    // Get tenant storage and user
    const tenantStorage = createTenantStorage(tenant.dbConnectionString || process.env.DATABASE_URL!);
    const user = await tenantStorage.getUser(decoded.userId);

    if (!user || !user.isActive || user.tenantId !== tenant.id) {
      res.status(401).json({ message: 'Invalid or inactive user' });
      return;
    }

    req.user = user;
    req.tenant = {
      id: tenant.id,
      subdomain: tenant.subdomain,
      connectionString: tenant.dbConnectionString || process.env.DATABASE_URL!
    };
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// ==================== ROLE-BASED ACCESS CONTROL ====================

// Platform roles: super_admin, product_owner
export const requirePlatformRole = (roles: string[]) => {
  return (req: AuthenticatedPlatformRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

// Tenant roles: admin, manager, user
export const requireTenantRole = (roles: string[]) => {
  return (req: AuthenticatedTenantRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

// Super admin only (platform level)
export const requireSuperAdmin = requirePlatformRole(['super_admin']);

// Product owner or super admin (platform level)
export const requirePlatformAdmin = requirePlatformRole(['super_admin', 'product_owner']);

// Tenant admin only
export const requireTenantAdmin = requireTenantRole(['admin']);

// Tenant manager or admin
export const requireTenantManager = requireTenantRole(['admin', 'manager']);

// Any authenticated tenant user
export const requireTenantUser = requireTenantRole(['admin', 'manager', 'user']);