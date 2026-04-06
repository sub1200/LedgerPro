// License Check Middleware
import licenseService from '../services/license.service.js';

export async function checkLicense(req, res, next) {
  const licenseKey = req.headers['x-license-key'];
  
  // Skip license check for license routes and demo
  if (req.path.startsWith('/license') || req.path === '/health') {
    return next();
  }
  
  if (!licenseKey) {
    return res.status(401).json({ 
      error: 'License key required',
      code: 'NO_LICENSE_KEY'
    });
  }
  
  const validation = licenseService.validateLicenseKey(licenseKey);
  
  if (!validation.valid) {
    return res.status(401).json({ 
      error: validation.error,
      code: 'INVALID_LICENSE'
    });
  }
  
  // Check if license is expired
  if (validation.license.expiresAt) {
    const expiryDate = new Date(validation.license.expiresAt);
    if (expiryDate < new Date()) {
      return res.status(401).json({ 
        error: 'License expired',
        code: 'LICENSE_EXPIRED'
      });
    }
  }
  
  req.license = validation.license;
  next();
}

export default { checkLicense };