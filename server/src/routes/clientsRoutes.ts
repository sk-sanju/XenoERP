import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

// GET /api/clients - List all active clients
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.organizationId;
    const { search } = req.query;

    const where: any = {
      ...(orgId ? { organization_id: orgId } : {}),
      OR: [
        { is_client: true },
        { lead_statuses: { name: { contains: 'converted', mode: 'insensitive' } } },
      ],
    };

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { company_name: { contains: search as string, mode: 'insensitive' } },
            { email: { contains: search as string, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const clients = await prisma.leads.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        lead_statuses: true,
        tasks: {
          take: 3,
          orderBy: { id: 'desc' },
        },
      },
    });

    res.json({
      success: true,
      clients,
    });
  } catch (error) {
    console.error('Clients fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch clients.' });
  }
});

export default router;
