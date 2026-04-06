import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Get all journal entries
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    const where = { companyId: req.user.companyId };
    if (status) where.status = status;
    
    const entries = await prisma.journalEntry.findMany({
      where,
      include: { lines: { include: { account: true } } },
      orderBy: { date: 'desc' },
      skip: (page - 1) * pageSize,
      take: parseInt(pageSize)
    });
    
    const total = await prisma.journalEntry.count({ where });
    
    res.json({ 
      data: entries, 
      meta: { page: parseInt(page), pageSize: parseInt(pageSize), total } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single journal entry
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const entry = await prisma.journalEntry.findFirst({
      where: { id: parseInt(req.params.id), companyId: req.user.companyId },
      include: { lines: { include: { account: true } } }
    });
    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }
    res.json({ data: entry });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create journal entry
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { date, description, lines } = req.body;
    
    // Generate entry number
    const count = await prisma.journalEntry.count({ where: { companyId: req.user.companyId } });
    const entryNumber = `JE-${String(count + 1).padStart(4, '0')}`;
    
    // Validate debits = credits
    const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({ error: 'Debits must equal credits' });
    }
    
    const entry = await prisma.journalEntry.create({
      data: {
        entryNumber,
        date: new Date(date),
        description,
        companyId: req.user.companyId,
        lines: {
          create: lines.map(line => ({
            accountId: line.accountId,
            debit: line.debit || 0,
            credit: line.credit || 0,
            memo: line.memo
          }))
        }
      },
      include: { lines: { include: { account: true } } }
    });
    
    res.json({ data: entry });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Post journal entry
router.post('/:id/post', authMiddleware, async (req, res) => {
  try {
    const entry = await prisma.journalEntry.findFirst({
      where: { id: parseInt(req.params.id), companyId: req.user.companyId }
    });
    
    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }
    
    if (entry.status === 'posted') {
      return res.status(400).json({ error: 'Entry already posted' });
    }
    
    const updated = await prisma.journalEntry.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'posted' }
    });
    
    res.json({ data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete journal entry (only draft)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const entry = await prisma.journalEntry.findFirst({
      where: { id: parseInt(req.params.id), companyId: req.user.companyId }
    });
    
    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }
    
    if (entry.status === 'posted') {
      return res.status(400).json({ error: 'Cannot delete posted entries' });
    }
    
    await prisma.journalEntry.delete({
      where: { id: parseInt(req.params.id) }
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;