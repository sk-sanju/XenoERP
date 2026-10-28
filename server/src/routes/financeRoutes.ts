import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

// GET /api/finance/summary
router.get('/summary', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.organizationId;
    const orgFilter = orgId ? { organization_id: orgId } : {};

    const incomes = await prisma.incomes.findMany({
      where: orgFilter,
      orderBy: { date: 'desc' },
      take: 20,
    });

    const expenses = await prisma.expenses.findMany({
      where: orgFilter,
      orderBy: { date: 'desc' },
      take: 20,
    });

    const totalIncome = incomes.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const totalExpense = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    res.json({
      success: true,
      summary: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
      },
      recentIncomes: incomes,
      recentExpenses: expenses,
    });
  } catch (error) {
    console.error('Finance summary error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch finance summary.' });
  }
});

// POST /api/finance/incomes
router.post('/incomes', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.organizationId;
    const { title, amount, date, description, category } = req.body;

    const income = await prisma.incomes.create({
      data: {
        title,
        amount: Number(amount),
        date: date ? new Date(date) : new Date(),
        description: description || null,
        category: category || 'General',
        organization_id: orgId || null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    res.status(201).json({ success: true, income });
  } catch (error) {
    console.error('Create income error:', error);
    res.status(500).json({ success: false, error: 'Failed to create income record.' });
  }
});

// POST /api/finance/expenses
router.post('/expenses', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.organizationId;
    const { title, amount, date, description } = req.body;

    const expense = await prisma.expenses.create({
      data: {
        title,
        amount: Number(amount),
        date: date ? new Date(date) : new Date(),
        description: description || null,
        organization_id: orgId || null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    res.status(201).json({ success: true, expense });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ success: false, error: 'Failed to create expense record.' });
  }
});

export default router;
