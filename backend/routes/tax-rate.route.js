import express from 'express';
import { auth } from '../middleware/auth';
import { createTaxRate } from '../services/tax-rate.service';

const router = express.Router();

router.post('/v1/tax-rates', auth(['ADMIN', 'ACCOUNTANT']), async (req, res) => {
  const taxRate = await createTaxRate(req.body, req.user.id, req.user.companyId);
  res.status(201).json(taxRate);
});

export default router;