import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Get dashboard KPIs
router.get('/', authMiddleware, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    
    // Cash balance (Account 1000)
    const cashAccount = await prisma.account.findFirst({
      where: { companyId, code: '1000' }
    });
    
    let cashBalance = 0;
    if (cashAccount) {
      const debits = await prisma.journalLine.aggregate({
        where: { accountId: cashAccount.id },
        _sum: { debit: true }
      });
      const credits = await prisma.journalLine.aggregate({
        where: { accountId: cashAccount.id },
        _sum: { credit: true }
      });
      cashBalance = (debits._sum.debit || 0) - (credits._sum.credit || 0);
    }
    
    // AR Aging
    const arAccount = await prisma.account.findFirst({
      where: { companyId, code: '1100' }
    });
    
    let arBalance = 0;
    let arOverdue = 0;
    if (arAccount) {
      const debits = await prisma.journalLine.aggregate({
        where: { accountId: arAccount.id },
        _sum: { debit: true }
      });
      const credits = await prisma.journalLine.aggregate({
        where: { accountId: arAccount.id },
        _sum: { credit: true }
      });
      arBalance = (debits._sum.debit || 0) - (credits._sum.credit || 0);
    }
    
    // AR Overdue (invoices overdue)
    const overdueInvoices = await prisma.invoice.findMany({
      where: { 
        companyId, 
        status: { in: ['sent', 'overdue'] },
        dueDate: { lt: new Date() }
      }
    });
    arOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0);
    
    // AP Aging
    const apAccount = await prisma.account.findFirst({
      where: { companyId, code: '2000' }
    });
    
    let apBalance = 0;
    if (apAccount) {
      const debits = await prisma.journalLine.aggregate({
        where: { accountId: apAccount.id },
        _sum: { debit: true }
      });
      const credits = await prisma.journalLine.aggregate({
        where: { accountId: apAccount.id },
        _sum: { credit: true }
      });
      apBalance = (credits._sum.credit || 0) - (debits._sum.debit || 0);
    }
    
    // Monthly Revenue
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const revenueAccount = await prisma.account.findFirst({
      where: { companyId, code: '4000' }
    });
    
    let monthlyRevenue = 0;
    if (revenueAccount) {
      const revenueLines = await prisma.journalLine.findMany({
        where: { accountId: revenueAccount.id }
      });
      monthlyRevenue = revenueLines.reduce((sum, l) => sum + (l.credit || 0), 0);
    }
    
    // Monthly Expenses
    const expenseAccounts = await prisma.account.findMany({
      where: { companyId, type: 'expense' }
    });
    
    let monthlyExpenses = 0;
    for (const acc of expenseAccounts) {
      const lines = await prisma.journalLine.findMany({
        where: { accountId: acc.id }
      });
      monthlyExpenses += lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    }
    
    // Net Profit
    const netProfit = monthlyRevenue - monthlyExpenses;
    
    // Tax Liability
    const taxAccount = await prisma.account.findFirst({
      where: { companyId, code: '2100' }
    });
    
    let taxLiability = 0;
    if (taxAccount) {
      const credits = await prisma.journalLine.aggregate({
        where: { accountId: taxAccount.id },
        _sum: { credit: true }
      });
      taxLiability = credits._sum.credit || 0;
    }
    
    // Recent Invoices
    const recentInvoices = await prisma.invoice.findMany({
      where: { companyId },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    // Recent Expenses
    const recentExpenses = await prisma.expense.findMany({
      where: { companyId },
      orderBy: { date: 'desc' },
      take: 5
    });
    
    res.json({
      data: {
        cashBalance,
        arBalance,
        arOverdue,
        apBalance,
        monthlyRevenue,
        monthlyExpenses,
        netProfit,
        taxLiability,
        recentInvoices,
        recentExpenses
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;