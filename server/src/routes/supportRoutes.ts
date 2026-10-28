import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

// GET /api/support/tickets
router.get('/tickets', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.organizationId;
    const tickets = await prisma.tickets.findMany({
      where: orgId ? { organization_id: orgId } : {},
      orderBy: { id: 'desc' },
      take: 25,
      include: {
        ticket_statuses: true,
      },
    });

    const statuses = await prisma.ticket_statuses.findMany({
      where: orgId ? { organization_id: orgId } : {},
    });

    res.json({ success: true, tickets, statuses });
  } catch (error) {
    console.error('Support tickets fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tickets.' });
  }
});

export default router;
