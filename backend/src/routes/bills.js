import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Get all bills
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    const where = { companyId: req.user.companyId };
    if (status) where.status = status;
    
    const bills = await prisma.bill.findMany({
      where,
      include: { vendor: true, lines: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: parseInt(pageSize)
    });
    
    const total = await prisma.bill.count({ where });
    
    res.json({ 
      data: bills, 
      meta: { page: parseInt(page), pageSize: parseInt(pageSize), total } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single bill
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const bill = await prisma.bill.findFirst({
      where: { id: parseInt(req.params.id), companyId: req.user.companyId },
      include: { vendor: true, lines: true }
    });
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    res.json({ data: bill });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create bill
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { vendorId, issueDate, dueDate, lines, currency, notes, taxRate = 0 } = req.body;
    
    // Generate bill number
    const count = await prisma.bill.count({ where: { companyId: req.user.companyId } });
    const billNumber = `BILL-${String(count + 1).padStart(4, '0')}`;
    
    // Calculate totals
    let subtotal = 0;
    const billLines = lines.map(line => {
      const total = line.quantity * line.unitPrice;
      subtotal += total;
      return { ...line, total };
    });
    
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    
    const bill = await prisma.bill.create({
      data: {
        billNumber,
        vendorId,
        companyId: req.user.companyId,
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        subtotal,
        taxAmount,
        total,
        currency: currency || 'USD',
        notes,
        lines: { create: billLines }
      },
      include: { lines: true, vendor: true }
    });
    
    res.json({ data: bill });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update bill status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const bill = await prisma.bill.update({
      where: { id: parseInt(req.params.id) },
      data: { status }
    });
    res.json({ data: bill });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete bill
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.bill.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;