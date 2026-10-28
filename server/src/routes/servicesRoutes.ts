import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

// GET /api/services
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.organizationId;
    const services = await prisma.services.findMany({
      where: orgId ? { organization_id: orgId } : {},
      orderBy: { id: 'asc' },
    });

    res.json({ success: true, services });
  } catch (error) {
    console.error('Services fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch services.' });
  }
});

export default router;
