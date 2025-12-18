import jwt from 'jsonwebtoken';
import * as express from 'express';
import User from '../models/User.ts';
import * as types from '../types.ts';

type Response = express.Response;
type NextFunction = express.NextFunction;
type AuthenticatedRequest = types.AuthenticatedRequest;

const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'JWT secret not configured'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;

    // Get user from database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid - user not found'
      });
    }

    // Add user to request object
    const userObj: types.AuthenticatedRequest['user'] = {
      id: user._id.toString(),
      email: user.email,
      role: user.role
    };

    if (user.emoId) userObj.emoId = user.emoId;
    if (user.clinicianId) userObj.clinicianId = user.clinicianId;
    if (user.radiologistId) userObj.radiologistId = user.radiologistId;

    req.user = userObj;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

// Middleware to check for specific roles
const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

export { authMiddleware, authorize };

// For backward compatibility
export const authenticateToken = authMiddleware;
export const authorizeRoles = authorize;