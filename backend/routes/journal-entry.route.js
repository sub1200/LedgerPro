import express from 'express';
import { auth } from '../middleware/auth';
import { createJournalEntry } from '../services/journal-entry.service';

const router = express.Router();

router.post('/v1/journal-entries', auth(['ADMIN', 'ACCOUNTANT']), async (req, res) => {
  const journalEntry = await createJournalEntry(req.body, req.user.id, req.user.companyId);
  res.status(201).json(journalEntry);
});

export default router;