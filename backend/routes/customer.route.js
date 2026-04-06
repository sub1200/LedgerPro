import express from 'express';
import { auth } from '../middleware/auth';
import { createCustomer } from '../services/customer.service';

const router = express.Router();

router.post('/v1/customers', auth(['ADMIN', 'ACCOUNTANT']), async (req, res) => {
  const customer = await createCustomer(req.body, req.user.id, req.user.companyId);
  res.status(201).json(customer);
});

export default router;