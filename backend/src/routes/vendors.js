import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Get all vendors
router.get('/', authMiddleware, async (req, res) => {
  try {
    const vendors = await prisma.vendor.findMany({
      where: { companyId: req.user.companyId },
      orderBy: { name: 'asc' }
    });
    res.json({ data: vendors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create vendor
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const vendor = await prisma.vendor.create({
      data: { name, email, phone, address, companyId: req.user.companyId }
    });
    res.json({ data: vendor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update vendor
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const vendor = await prisma.vendor.update({
      where: { id: parseInt(req.params.id) },
      data: { name, email, phone, address }
    });
    res.json({ data: vendor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete vendor
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.vendor.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;