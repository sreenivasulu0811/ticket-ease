import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AppError } from './error.middleware.js';
import { prisma } from '../utils/prisma.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN' | 'OPERATOR';
  name: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Please log in.', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('Authentication token missing.', 401, 'UNAUTHORIZED');
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as { id: string; email: string; role: any };
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true, name: true }
      });

      if (!user) {
        throw new AppError('User account no longer exists.', 401, 'USER_NOT_FOUND');
      }

      req.user = user as AuthenticatedUser;
      next();
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Token has expired. Please log in again.', 401, 'TOKEN_EXPIRED');
      }
      throw new AppError('Invalid authentication token.', 401, 'INVALID_TOKEN');
    }
  } catch (error) {
    next(error);
  }
};

export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, config.jwt.secret) as { id: string; email: string; role: any };
          const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, role: true, name: true }
          });
          if (user) {
            req.user = user as AuthenticatedUser;
          }
        } catch {
          // Ignore error for optional auth
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (...roles: Array<'CUSTOMER' | 'ADMIN' | 'OPERATOR'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Forbidden: You do not have permission to access this resource.', 403, 'FORBIDDEN'));
    }

    next();
  };
};
