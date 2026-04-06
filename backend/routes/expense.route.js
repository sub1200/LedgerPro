import express from 'express';
import { auth } from '../middleware/auth';
import { createExpense } from '../services/expense.service';

const router = express.Router();

router.post('/v1/expenses', auth(['ADMIN', 'ACCOUNTANT']), async (req, res) => {
  const expense = await createExpense(req.body, req.user.id, req.user.companyId);
  res.status(201).json(expense);
});

export default router;