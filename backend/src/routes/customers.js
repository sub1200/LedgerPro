import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Get all customers
router.get('/', authMiddleware, async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { companyId: req.user.companyId },
      orderBy: { name: 'asc' }
    });
    res.json({ data: customers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create customer
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const customer = await prisma.customer.create({
      data: { name, email, phone, address, companyId: req.user.companyId }
    });
    res.json({ data: customer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update customer
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const customer = await prisma.customer.update({
      where: { id: parseInt(req.params.id) },
      data: { name, email, phone, address }
    });
    res.json({ data: customer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete customer
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.customer.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;