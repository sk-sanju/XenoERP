import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.organizationId;
    const orgFilter = orgId ? { organization_id: orgId } : {};

    // 1. Leads counts
    const totalLeads = await prisma.leads.count({ where: orgFilter });

    // 2. Converted clients
    const convertedLeads = await prisma.leads.count({
      where: {
        ...orgFilter,
        OR: [
          { lead_statuses: { name: { contains: 'converted', mode: 'insensitive' } } },
          { is_client: true }
        ]
      }
    });

    // 3. Tasks / Projects counts
    const totalTasks = await prisma.tasks.count({ where: orgFilter });
    const completedTasks = await prisma.tasks.count({
      where: {
        ...orgFilter,
        project_statuses: { name: { contains: 'completed', mode: 'insensitive' } }
      }
    });

    // 4. Incomes & Expenses sum
    const incomes = await prisma.incomes.findMany({
      where: orgFilter,
      select: { amount: true }
    });
    const totalRevenue = incomes.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    const expenses = await prisma.expenses.findMany({
      where: orgFilter,
      select: { amount: true }
    });
    const totalExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    // 5. Recent leads
    const recentLeads = await prisma.leads.findMany({
      where: orgFilter,
      orderBy: { id: 'desc' },
      take: 5,
      include: {
        lead_statuses: true,
      }
    });

    // 6. Recent tasks
    const recentTasks = await prisma.tasks.findMany({
      where: orgFilter,
      orderBy: { id: 'desc' },
      take: 5,
      include: {
        project_statuses: true,
      }
    });

    res.json({
      success: true,
      stats: {
        totalLeads,
        convertedClients: convertedLeads,
        totalTasks,
        completedTasks,
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
      },
      recentLeads,
      recentTasks,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard metrics.' });
  }
});

export default router;
