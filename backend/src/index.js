import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import accountRoutes from './routes/accounts.js';
import customerRoutes from './routes/customers.js';
import vendorRoutes from './routes/vendors.js';
import invoiceRoutes from './routes/invoices.js';
import billRoutes from './routes/bills.js';
import expenseRoutes from './routes/expenses.js';
import journalRoutes from './routes/journal.js';
import dashboardRoutes from './routes/dashboard.js';
import licenseRoutes from './routes/license.js';
import { checkLicense } from './middleware/license.middleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Apply license check to all API routes (except license itself)
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/license')) {
    return next();
  }
  checkLicense(req, res, next);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/license', licenseRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Accounting API running on port ${PORT}`);
});

export default app;