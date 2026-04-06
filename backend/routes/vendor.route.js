import express from 'express';
import { auth } from '../middleware/auth';
import { createVendor } from '../services/vendor.service';

const router = express.Router();

router.post('/v1/vendors', auth(['ADMIN', 'ACCOUNTANT']), async (req, res) => {
  const vendor = await createVendor(req.body, req.user.id, req.user.companyId);
  res.status(201).json(vendor);
});

export default router;