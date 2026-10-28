import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { verifyPassword, generateToken } from '../lib/auth';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ success: false, error: 'Username and password are required.' });
      return;
    }

    const user = await prisma.auth_user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username },
        ],
      },
      include: {
        user_profiles: {
          include: {
            organizations: true,
          },
        },
      },
    });

    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid username or password.' });
      return;
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      res.status(401).json({ success: false, error: 'Invalid username or password.' });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({ success: false, error: 'Account is inactive. Please contact your administrator.' });
      return;
    }

    const profile = user.user_profiles[0] || null;
    const token = generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
    });

    // Set secure HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        isSuperuser: user.is_superuser,
        isStaff: user.is_staff,
        role: profile?.role || (user.is_superuser ? 'Admin' : 'Staff'),
        organization: profile?.organizations || null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Server error during login.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    user: req.user,
  });
});

export default router;
