import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Get all accounts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { companyId: req.user.companyId },
      orderBy: { code: 'asc' }
    });
    res.json({ data: accounts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get account by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const account = await prisma.account.findFirst({
      where: { id: parseInt(req.params.id), companyId: req.user.companyId }
    });
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.json({ data: account });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create account
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { code, name, type, parentId } = req.body;
    
    const existing = await prisma.account.findFirst({
      where: { code, companyId: req.user.companyId }
    });
    if (existing) {
      return res.status(400).json({ error: 'Account code already exists' });
    }
    
    const account = await prisma.account.create({
      data: { code, name, type, parentId, companyId: req.user.companyId }
    });
    res.json({ data: account });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update account
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, isActive } = req.body;
    
    const account = await prisma.account.findFirst({
      where: { id: parseInt(req.params.id), companyId: req.user.companyId }
    });
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    const updated = await prisma.account.update({
      where: { id: parseInt(req.params.id) },
      data: { name, isActive }
    });
    res.json({ data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get account balance
router.get('/:id/balance', authMiddleware, async (req, res) => {
  try {
    const account = await prisma.account.findFirst({
      where: { id: parseInt(req.params.id), companyId: req.user.companyId }
    });
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    const debits = await prisma.journalLine.aggregate({
      where: { accountId: account.id },
      _sum: { debit: true }
    });
    
    const credits = await prisma.journalLine.aggregate({
      where: { accountId: account.id },
      _sum: { credit: true }
    });
    
    const debitTotal = debits._sum.debit || 0;
    const creditTotal = credits._sum.credit || 0;
    
    let balance = 0;
    if (['asset', 'expense'].includes(account.type)) {
      balance = debitTotal - creditTotal;
    } else {
      balance = creditTotal - debitTotal;
    }
    
    res.json({ data: { balance, debits: debitTotal, credits: creditTotal } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;