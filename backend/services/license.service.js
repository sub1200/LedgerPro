const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const LICENSE_KEY_DIR = path.join(__dirname, '../../licenses');
const LICENSE_SECRET = process.env.LICENSE_SECRET || 'your-secret-key-change-in-production';

// Ensure licenses directory exists
if (!fs.existsSync(LICENSE_KEY_DIR)) {
  fs.mkdirSync(LICENSE_KEY_DIR, { recursive: true });
}

// Generate a new license key
function generateLicenseKey(licenseData) {
  const payload = {
    ...licenseData,
    createdAt: new Date().toISOString(),
    key: crypto.randomBytes(8).toString('hex').toUpperCase()
  };
  
  const json = JSON.stringify(payload);
  const encrypted = crypto
    .createCipher('aes-256-cbc', LICENSE_SECRET)
    .update(json, 'utf8', 'hex')
    .final('hex');
  
  return encrypted;
}

// Validate a license key
function validateLicenseKey(encryptedKey) {
  try {
    const decrypted = crypto
      .createDecipher('aes-256-cbc', LICENSE_SECRET)
      .update(encryptedKey, 'hex', 'utf8')
      .final('utf8');
    
    const license = JSON.parse(decrypted);
    
    // Check expiry
    if (license.expiresAt) {
      const expiryDate = new Date(license.expiresAt);
      if (expiryDate < new Date()) {
        return { valid: false, error: 'License expired', license };
      }
    }
    
    return { valid: true, license };
  } catch (error) {
    return { valid: false, error: 'Invalid license key' };
  }
}

// Save license to file (for tracking)
function saveLicense(encryptedKey, license) {
  const filename = path.join(LICENSE_KEY_DIR, `${license.key}.json`);
  fs.writeFileSync(filename, JSON.stringify({
    encryptedKey,
    license,
    activatedAt: new Date().toISOString()
  }, null, 2));
}

// Get all licenses (admin)
function getAllLicenses() {
  const files = fs.readdirSync(LICENSE_KEY_DIR);
  return files.map(f => {
    const data = JSON.parse(fs.readFileSync(path.join(LICENSE_KEY_DIR, f), 'utf8'));
    return data.license;
  });
}

// Create demo license (for testing)
function createDemoLicense() {
  const demoData = {
    type: 'demo',
    duration: 7, // days
    features: ['all'],
    maxDevices: 1,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
  
  return generateLicenseKey(demoData);
}

// Create subscription license
function createSubscription License(type, durationDays, features, maxDevices) {
  const data = {
    type,
    duration: durationDays,
    features,
    maxDevices,
    expiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
  };
  
  return generateLicenseKey(data);
}

module.exports = {
  generateLicenseKey,
  validateLicenseKey,
  saveLicense,
  getAllLicenses,
  createDemoLicense,
  createSubscription
};