import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

// GET /api/projects - List all projects / tasks
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.organizationId;
    const { status_id, search } = req.query;

    const where: any = orgId ? { organization_id: orgId } : {};

    if (status_id && status_id !== 'all') {
      where.status_id = BigInt(status_id as string);
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const projects = await prisma.tasks.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        project_statuses: true,
        leads: {
          select: { id: true, name: true, company_name: true },
        },
        task_todos: true,
        task_milestones: true,
      },
    });

    const statuses = await prisma.project_statuses.findMany({
      where: orgId ? { organization_id: orgId } : {},
      orderBy: { id: 'asc' },
    });

    res.json({
      success: true,
      projects,
      statuses,
    });
  } catch (error) {
    console.error('Projects fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch projects.' });
  }
});

// POST /api/projects - Create task
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.organizationId;
    const { title, description, due_date, status_id, lead_id } = req.body;

    if (!title) {
      res.status(400).json({ success: false, error: 'Project/task title is required.' });
      return;
    }

    let defaultStatusId = status_id ? BigInt(status_id) : null;
    if (!defaultStatusId && orgId) {
      const firstStatus = await prisma.project_statuses.findFirst({
        where: { organization_id: orgId },
        orderBy: { id: 'asc' },
      });
      if (firstStatus) defaultStatusId = firstStatus.id;
    }

    const task = await prisma.tasks.create({
      data: {
        title,
        description: description || null,
        due_date: due_date ? new Date(due_date) : null,
        status_id: defaultStatusId,
        organization_id: orgId || null,
        lead_id: lead_id ? BigInt(lead_id) : null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        project_statuses: true,
      },
    });

    res.status(201).json({ success: true, project: task });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ success: false, error: 'Failed to create project.' });
  }
});

// PUT /api/projects/:id - Update status / details
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = BigInt(req.params.id);
    const { title, description, status_id, is_completed } = req.body;

    const data: any = { updated_at: new Date() };
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (status_id !== undefined) data.status_id = BigInt(status_id);
    if (is_completed !== undefined) data.is_completed = Boolean(is_completed);

    const task = await prisma.tasks.update({
      where: { id },
      data,
      include: {
        project_statuses: true,
      },
    });

    res.json({ success: true, project: task });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ success: false, error: 'Failed to update project.' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = BigInt(req.params.id);
    await prisma.tasks.delete({ where: { id } });
    res.json({ success: true, message: 'Project deleted successfully.' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete project.' });
  }
});

export default router;
