const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

// Middleware: Authenticate any JWT token
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided. Access denied.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// Middleware: Require Employee role
const requireEmployee = (req, res, next) => {
  authenticate(req, res, () => {
    if (req.user.role === 'employee' || req.user.role === 'manager' || req.user.role === 'admin' || req.user.role === 'super_admin') {
      next();
    } else {
      return res.status(403).json({ success: false, message: 'Access denied. Employee role required.' });
    }
  });
};

// Middleware: Require Admin role
const requireAdmin = (req, res, next) => {
  authenticate(req, res, () => {
    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      next();
    } else {
      return res.status(403).json({ success: false, message: 'Access denied. Admin role required.' });
    }
  });
};

// Middleware: Require Super Admin
const requireSuperAdmin = (req, res, next) => {
  authenticate(req, res, () => {
    if (req.user.role === 'super_admin') {
      next();
    } else {
      return res.status(403).json({ success: false, message: 'Access denied. Super Admin role required.' });
    }
  });
};

// Generate tokens
const generateEmployeeToken = (employee) => {
  return jwt.sign(
    {
      id: employee.id,
      employeeId: employee.employee_id,
      username: employee.username,
      role: employee.role,
      officeId: employee.office_id,
      type: 'employee'
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EMPLOYEE_EXPIRES_IN || '12h' }
  );
};

const generateAdminToken = (admin) => {
  return jwt.sign(
    {
      id: admin.id,
      username: admin.username,
      role: 'super_admin',
      type: 'admin'
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = { authenticate, requireEmployee, requireAdmin, requireSuperAdmin, generateEmployeeToken, generateAdminToken };
