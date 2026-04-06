import express from 'express';
import { auth } from '../middleware/auth';
import { createExpenseAccount } from '../services/expense-account.service';

const router = express.Router();

router.post('/v1/expense-accounts', auth(['ADMIN', 'ACCOUNTANT']), async (req, res) => {
  const expenseAccount = await createExpenseAccount(req.body, req.user.id, req.user.companyId);
  res.status(201).json(expenseAccount);
});

export default router;