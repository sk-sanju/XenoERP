import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

// GET /api/leads - List all leads
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.organizationId;
    const { status, search } = req.query;

    const where: any = orgId ? { organization_id: orgId } : {};

    if (status && status !== 'all') {
      where.status_id = BigInt(status as string);
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { company_name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const leads = await prisma.leads.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        lead_statuses: true,
      },
    });

    const statuses = await prisma.lead_statuses.findMany({
      where: orgId ? { organization_id: orgId } : {},
      orderBy: { id: 'asc' },
    });

    res.json({
      success: true,
      leads,
      statuses,
    });
  } catch (error) {
    console.error('Leads fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leads.' });
  }
});

// POST /api/leads - Create new lead
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orgId = req.organizationId;
    const { name, company_name, email, phone, status_id, value, source, notes } = req.body;

    if (!name) {
      res.status(400).json({ success: false, error: 'Lead name is required.' });
      return;
    }

    let defaultStatusId = status_id ? BigInt(status_id) : null;
    if (!defaultStatusId && orgId) {
      const firstStatus = await prisma.lead_statuses.findFirst({
        where: { organization_id: orgId },
        orderBy: { id: 'asc' },
      });
      if (firstStatus) defaultStatusId = firstStatus.id;
    }

    const newLead = await prisma.leads.create({
      data: {
        name,
        company_name: company_name || null,
        email: email || null,
        phone: phone || null,
        status_id: defaultStatusId,
        organization_id: orgId || null,
        notes: notes || null,
        source: source || 'Manual Entry',
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        lead_statuses: true,
      },
    });

    res.status(201).json({
      success: true,
      lead: newLead,
    });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ success: false, error: 'Failed to create lead.' });
  }
});

// PUT /api/leads/:id - Update lead
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const leadId = BigInt(req.params.id);
    const { name, company_name, email, phone, status_id, notes, is_client } = req.body;

    const data: any = { updated_at: new Date() };
    if (name !== undefined) data.name = name;
    if (company_name !== undefined) data.company_name = company_name;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (status_id !== undefined) data.status_id = BigInt(status_id);
    if (notes !== undefined) data.notes = notes;
    if (is_client !== undefined) data.is_client = Boolean(is_client);

    const updated = await prisma.leads.update({
      where: { id: leadId },
      data,
      include: {
        lead_statuses: true,
      },
    });

    res.json({
      success: true,
      lead: updated,
    });
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ success: false, error: 'Failed to update lead.' });
  }
});

// DELETE /api/leads/:id
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const leadId = BigInt(req.params.id);
    await prisma.leads.delete({
      where: { id: leadId },
    });
    res.json({ success: true, message: 'Lead deleted successfully.' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete lead.' });
  }
});

export default router;
