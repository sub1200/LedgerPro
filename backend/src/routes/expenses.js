import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Get all expenses
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category, startDate, endDate, page = 1, pageSize = 20 } = req.query;
    const where = { companyId: req.user.companyId };
    
    if (category) where.category = category;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    
    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: (page - 1) * pageSize,
      take: parseInt(pageSize)
    });
    
    const total = await prisma.expense.count({ where });
    
    res.json({ 
      data: expenses, 
      meta: { page: parseInt(page), pageSize: parseInt(pageSize), total } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create expense
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { date, description, amount, category, merchant, receiptUrl } = req.body;
    
    // AI categorization (simple rule-based for now)
    let aiCategory = category;
    let aiConfidence = 1.0;
    
    const expense = await prisma.expense.create({
      data: {
        date: new Date(date),
        description,
        amount,
        category: aiCategory,
        merchant,
        receiptUrl,
        aiCategory,
        aiConfidence,
        companyId: req.user.companyId
      }
    });
    
    res.json({ data: expense });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update expense
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { date, description, amount, category, merchant, receiptUrl } = req.body;
    const expense = await prisma.expense.update({
      where: { id: parseInt(req.params.id) },
      data: { date: new Date(date), description, amount, category, merchant, receiptUrl }
    });
    res.json({ data: expense });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete expense
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.expense.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get expense categories summary
router.get('/summary/categories', authMiddleware, async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { companyId: req.user.companyId }
    });
    
    const byCategory = {};
    expenses.forEach(exp => {
      if (!byCategory[exp.category]) byCategory[exp.category] = 0;
      byCategory[exp.category] += exp.amount;
    });
    
    res.json({ data: byCategory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;