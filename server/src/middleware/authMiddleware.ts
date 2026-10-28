import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/auth';
import { prisma } from '../lib/prisma';

export interface AuthenticatedRequest extends Request {
  user?: any;
  organizationId?: number | bigint;
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : req.cookies?.token;

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required. No token provided.' });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ success: false, error: 'Invalid or expired token.' });
    return;
  }

  try {
    const user = await prisma.auth_user.findUnique({
      where: { id: decoded.id },
      include: {
        user_profiles: {
          include: {
            organizations: true,
          },
        },
      },
    });

    if (!user || !user.is_active) {
      res.status(401).json({ success: false, error: 'User account not found or deactivated.' });
      return;
    }

    const profile = user.user_profiles[0] || null;
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      isSuperuser: user.is_superuser,
      isStaff: user.is_staff,
      profile,
      organization: profile?.organizations || null,
    };

    if (profile?.organization_id) {
      req.organizationId = profile.organization_id;
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ success: false, error: 'Internal authentication error.' });
  }
}
