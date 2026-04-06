import express from 'express';
import { auth } from '../middleware/auth';
import { createExpenseSubcategory } from '../services/expense-subcategory.service';

const router = express.Router();

router.post('/v1/expense-subcategories', auth(['ADMIN', 'ACCOUNTANT']), async (req, res) => {
  const expenseSubcategory = await createExpenseSubcategory(req.body, req.user.id, req.user.companyId);
  res.status(201).json(expenseSubcategory);
});

export default router;