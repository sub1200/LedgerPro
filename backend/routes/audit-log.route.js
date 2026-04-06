import express from 'express';
import { auth } from '../middleware/auth';
import { createAuditLog } from '../services/audit-log.service';

const router = express.Router();

router.post('/v1/audit-logs', auth(['ADMIN', 'ACCOUNTANT']), async (req, res) => {
  const auditLog = await createAuditLog(req.body, req.user.id, req.user.companyId);
  res.status(201).json(auditLog);
});

export default router;