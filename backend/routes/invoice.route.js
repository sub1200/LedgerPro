import express from 'express';
import { auth } from '../middleware/auth';
import { createInvoice } from '../services/invoice.service';

const router = express.Router();

router.post('/v1/invoices', auth(['ADMIN', 'ACCOUNTANT']), async (req, res) => {
  const invoice = await createInvoice(req.body, req.user.id, req.user.companyId);
  res.status(201).json(invoice);
});

export default router;