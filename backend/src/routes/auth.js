import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, companyName, currency } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const company = await prisma.company.create({
      data: { name: companyName || 'My Company', currency: currency || 'USD' }
    });
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        companyId: company.id
      }
    });
    
    // Create default chart of accounts
    await createDefaultAccounts(company.id);
    
    const token = generateToken(user);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = generateToken(user);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { company: true }
    });
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role, company: user.company });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function createDefaultAccounts(companyId) {
  const accounts = [
    { code: '1000', name: 'Cash', type: 'asset', parentId: null },
    { code: '1100', name: 'Accounts Receivable', type: 'asset', parentId: null },
    { code: '1200', name: 'Inventory', type: 'asset', parentId: null },
    { code: '2000', name: 'Accounts Payable', type: 'liability', parentId: null },
    { code: '2100', name: 'VAT Payable', type: 'liability', parentId: null },
    { code: '3000', name: 'Owner\'s Equity', type: 'equity', parentId: null },
    { code: '4000', name: 'Sales Revenue', type: 'revenue', parentId: null },
    { code: '5000', name: 'Rent Expense', type: 'expense', parentId: null },
    { code: '5100', name: 'Office Supplies', type: 'expense', parentId: null },
    { code: '5200', name: 'Utilities Expense', type: 'expense', parentId: null },
  ];
  
  for (const account of accounts) {
    await prisma.account.create({
      data: { ...account, companyId }
    });
  }
}

export default router;