import express from 'express';
import { auth } from '../middleware/auth';
import { createPayment } from '../services/payment.service';

const router = express.Router();

router.post('/v1/payments', auth(['ADMIN', 'ACCOUNTANT']), async (req, res) => {
  const payment = await createPayment(req.body, req.user.id, req.user.companyId);
  res.status(201).json(payment);
});

export default router;