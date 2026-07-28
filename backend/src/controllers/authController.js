const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { generateEmployeeToken, generateAdminToken } = require('../middleware/auth');
const { auditLog } = require('../middleware/audit');

// POST /api/auth/employee/login
const employeeLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const result = await query(
      `SELECT e.*, o.name as office_name FROM employees e
       LEFT JOIN offices o ON e.office_id = o.id
       WHERE e.username = $1 AND e.is_active = true`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const employee = result.rows[0];
    const isValid = await bcrypt.compare(password, employee.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update last login
    await query('UPDATE employees SET last_login = NOW() WHERE id = $1', [employee.id]);

    const token = generateEmployeeToken(employee);

    await auditLog({
      actorType: 'employee', actorId: employee.id, actorName: employee.full_name,
      actorEmployeeId: employee.employee_id, officeId: employee.office_id,
      officeName: employee.office_name,
      action: 'LOGIN', actionCategory: 'auth',
      ipAddress: req.ip, userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        employee: {
          id: employee.id, employeeId: employee.employee_id,
          username: employee.username, fullName: employee.full_name,
          role: employee.role, officeId: employee.office_id, officeName: employee.office_name,
          designation: employee.designation,
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login failed', error: err.message });
  }
};

// POST /api/auth/admin/login
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const result = await query(
      'SELECT * FROM admins WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const admin = result.rows[0];
    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    await query('UPDATE admins SET last_login = NOW() WHERE id = $1', [admin.id]);
    const token = generateAdminToken(admin);

    await auditLog({
      actorType: 'admin', actorId: admin.id, actorName: admin.full_name,
      action: 'ADMIN_LOGIN', actionCategory: 'auth',
      ipAddress: req.ip, userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        token,
        admin: {
          id: admin.id, username: admin.username,
          fullName: admin.full_name, isSuperAdmin: admin.is_super_admin
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Admin login failed', error: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = req.user;
    if (user.type === 'admin') {
      const result = await query('SELECT id, username, full_name, email, is_super_admin, last_login FROM admins WHERE id = $1', [user.id]);
      return res.json({ success: true, data: { ...result.rows[0], role: 'super_admin', type: 'admin' } });
    }
    const result = await query(
      `SELECT e.id, e.employee_id, e.username, e.full_name, e.email, e.role, e.office_id, e.designation, e.last_login, o.name as office_name
       FROM employees e LEFT JOIN offices o ON e.office_id = o.id WHERE e.id = $1`,
      [user.id]
    );
    res.json({ success: true, data: { ...result.rows[0], type: 'employee' } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile', error: err.message });
  }
};

module.exports = { employeeLogin, adminLogin, getMe };
