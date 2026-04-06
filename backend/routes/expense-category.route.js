import express from 'express';
import { auth } from '../middleware/auth';
import { createExpenseCategory } from '../services/expense-category.service';

const router = express.Router();

router.post('/v1/expense-categories', auth(['ADMIN', 'ACCOUNTANT']), async (req, res) => {
  const expenseCategory = await createExpenseCategory(req.body, req.user.id, req.user.companyId);
  res.status(201).json(expenseCategory);
});

export default router;