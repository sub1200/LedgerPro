import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Get all invoices
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    const where = { companyId: req.user.companyId };
    if (status) where.status = status;
    
    const invoices = await prisma.invoice.findMany({
      where,
      include: { customer: true, lines: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: parseInt(pageSize)
    });
    
    const total = await prisma.invoice.count({ where });
    
    res.json({ 
      data: invoices, 
      meta: { page: parseInt(page), pageSize: parseInt(pageSize), total } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single invoice
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: parseInt(req.params.id), companyId: req.user.companyId },
      include: { customer: true, lines: true }
    });
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json({ data: invoice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create invoice
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { customerId, issueDate, dueDate, lines, currency, notes, taxRate = 0 } = req.body;
    
    // Generate invoice number
    const count = await prisma.invoice.count({ where: { companyId: req.user.companyId } });
    const invoiceNumber = `INV-${String(count + 1).padStart(4, '0')}`;
    
    // Calculate totals
    let subtotal = 0;
    const invoiceLines = lines.map(line => {
      const total = line.quantity * line.unitPrice;
      subtotal += total;
      return { ...line, total };
    });
    
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId,
        companyId: req.user.companyId,
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        subtotal,
        taxAmount,
        total,
        currency: currency || 'USD',
        notes,
        lines: { create: invoiceLines }
      },
      include: { lines: true, customer: true }
    });
    
    res.json({ data: invoice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update invoice status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const invoice = await prisma.invoice.update({
      where: { id: parseInt(req.params.id) },
      data: { status }
    });
    res.json({ data: invoice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete invoice
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.invoice.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;