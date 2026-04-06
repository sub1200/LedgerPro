const express = require('express');
const router = express.Router();
const licenseService = require('../services/license.service');

// Middleware to check license
async function checkLicense(req, res, next) {
  const licenseKey = req.headers['x-license-key'] || req.body.licenseKey;
  
  if (!licenseKey) {
    return res.status(401).json({ error: 'License key required' });
  }
  
  const validation = licenseService.validateLicenseKey(licenseKey);
  
  if (!validation.valid) {
    return res.status(401).json({ error: validation.error });
  }
  
  req.license = validation.license;
  next();
}

// Activate license
router.post('/activate', (req, res) => {
  const { licenseKey, deviceId } = req.body;
  
  if (!licenseKey) {
    return res.status(400).json({ error: 'License key required' });
  }
  
  const validation = licenseService.validateLicenseKey(licenseKey);
  
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }
  
  // Save license activation
  licenseService.saveLicense(licenseKey, {
    ...validation.license,
    deviceId,
    activatedAt: new Date().toISOString()
  });
  
  res.json({ 
    success: true, 
    license: validation.license,
    message: 'License activated successfully'
  });
});

// Validate license
router.post('/validate', (req, res) => {
  const { licenseKey } = req.body;
  
  if (!licenseKey) {
    return res.status(400).json({ error: 'License key required' });
  }
  
  const validation = licenseService.validateLicenseKey(licenseKey);
  
  res.json({
    valid: validation.valid,
    license: validation.license,
    error: validation.error
  });
});

// Create new license (admin only - should be protected)
router.post('/create', (req, res) => {
  const { type, duration, features, maxDevices } = req.body;
  
  const key = licenseService.createSubscription(type, duration, features, maxDevices);
  
  res.json({ success: true, licenseKey: key });
});

// Get demo license
router.get('/demo', (req, res) => {
  const demoKey = licenseService.createDemoLicense();
  
  res.json({ success: true, licenseKey: demoKey });
});

// Get all licenses (admin)
router.get('/admin/list', (req, res) => {
  const licenses = licenseService.getAllLicenses();
  res.json({ licenses });
});

// Protected route example
router.get('/status', checkLicense, (req, res) => {
  res.json({
    active: true,
    license: req.license
  });
});

module.exports = router;