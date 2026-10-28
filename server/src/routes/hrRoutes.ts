import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

// GET /api/hr/employees
router.get('/employees', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.organizationId;
    const orgFilter = orgId ? { organization_id: orgId } : {};

    const employees = await prisma.user_profiles.findMany({
      where: orgFilter,
      include: {
        auth_user: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true,
            email: true,
            is_active: true,
          },
        },
        departments: true,
      },
    });

    const leaveRequests = await prisma.hr_leave_requests.findMany({
      where: orgFilter,
      orderBy: { id: 'desc' },
      take: 10,
      include: {
        hr_leave_types: true,
        hr_leave_request_statuses: true,
      },
    });

    res.json({
      success: true,
      employees,
      recentLeaves: leaveRequests,
    });
  } catch (error) {
    console.error('HR fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch HR data.' });
  }
});

export default router;
