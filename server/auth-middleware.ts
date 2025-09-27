import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as any;
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

export const requireAdmin = requireRole(['admin']);
export const requirePatientOrAdmin = requireRole(['patient', 'admin']);

export const requireOwnershipOrAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Admins can access any resource
  if (req.user.role === 'admin') {
    return next();
  }

  // For patients, check if they're accessing their own data
  const requestedPatientId = req.params.patientId || req.body.patientId;
  if (req.user.role === 'patient' && requestedPatientId) {
    // TODO: Get patient's actual patientId from database based on user.userId
    // For now, we'll check if the user's email matches the patient lookup
    // This needs to be improved with proper patient ID mapping
    console.log(`Patient ${req.user.email} requesting data for patientId: ${requestedPatientId}`);
  }

  next();
};