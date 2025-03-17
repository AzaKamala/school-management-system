import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AccessTokenPayload } from '../../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    res.status(401).json({ error: 'Authorization header missing' });
    return;
  }
  
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    res.status(401).json({ error: 'Token missing' });
    return;
  }
  
  const decoded = verifyAccessToken(token);
  
  if (!decoded) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
  
  req.user = decoded;
  
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.isAdmin) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  
  next();
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.permissions.includes(permission)) {
      res.status(403).json({ error: `Permission '${permission}' required` });
      return;
    }
    
    next();
  };
}

export function requireTenantAccess(req: Request, res: Response, next: NextFunction) {
  const tenantId = req.params.tenantId;
  
  if (!tenantId) {
    res.status(400).json({ error: 'Tenant ID required' });
    return;
  }
  
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  
  if (req.user.isAdmin) {
    next();
    return;
  }
  
  if (req.user.tenantId !== tenantId) {
    res.status(403).json({ error: 'Access denied for this tenant' });
    return;
  }
  
  next();
}