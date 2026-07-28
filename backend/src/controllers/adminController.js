const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { auditLog } = require('../middleware/audit');

// GET /api/admin/employees
const getEmployees = async (req, res) => {
  try {
    const { officeId } = req.query;
    let sql = `SELECT e.id, e.employee_id, e.username, e.full_name, e.email, e.phone, e.role, e.designation, e.is_active, e.last_login, e.created_at, o.name as office_name, e.office_id
               FROM employees e LEFT JOIN offices o ON e.office_id = o.id WHERE 1=1`;
    const params = [];
    if (officeId) { params.push(officeId); sql += ` AND e.office_id = $${params.length}`; }
    sql += ' ORDER BY e.created_at DESC';
    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch employees', error: err.message });
  }
};

// POST /api/admin/employees
const createEmployee = async (req, res) => {
  try {
    const { employeeId, username, password, fullName, email, phone, officeId, role, designation } = req.body;
    const admin = req.user;

    // Validate unique
    const existing = await query('SELECT id FROM employees WHERE username = $1 OR employee_id = $2', [username, employeeId]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Username or Employee ID already exists' });
    }

    const passwordHash = await bcrypt.hash(password || 'Employee@123', 12);
    const result = await query(
      `INSERT INTO employees (employee_id, username, password_hash, full_name, email, phone, office_id, role, designation)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, employee_id, username, full_name, email, role, designation, office_id`,
      [employeeId, username, passwordHash, fullName, email, phone, officeId, role || 'employee', designation]
    );

    await auditLog({
      actorType: 'admin', actorId: admin.id, actorName: admin.username,
      action: 'CREATE_EMPLOYEE', actionCategory: 'administration',
      newValue: `${username} (${employeeId})`, details: { officeId, role },
      ipAddress: req.ip, userAgent: req.headers['user-agent'],
    });

    res.status(201).json({ success: true, data: result.rows[0], message: 'Employee created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create employee', error: err.message });
  }
};

// PUT /api/admin/employees/:id/reset-password
const resetEmployeePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const admin = req.user;

    const passwordHash = await bcrypt.hash(newPassword || 'Employee@123', 12);
    const result = await query(
      'UPDATE employees SET password_hash = $1 WHERE id = $2 RETURNING employee_id, username',
      [passwordHash, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Employee not found' });

    await auditLog({
      actorType: 'admin', actorId: admin.id, actorName: admin.username,
      action: 'RESET_PASSWORD', actionCategory: 'administration',
      details: { targetEmployeeId: id, targetUsername: result.rows[0].username },
      ipAddress: req.ip, userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to reset password', error: err.message });
  }
};

// DELETE /api/admin/employees/:id (soft delete)
const deactivateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = req.user;

    const result = await query(
      'UPDATE employees SET is_active = false WHERE id = $1 RETURNING employee_id, username',
      [id]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Employee not found' });

    await auditLog({
      actorType: 'admin', actorId: admin.id, actorName: admin.username,
      action: 'DEACTIVATE_EMPLOYEE', actionCategory: 'administration',
      details: { targetEmployeeId: id, targetUsername: result.rows[0].username },
      ipAddress: req.ip, userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, message: 'Employee deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to deactivate employee', error: err.message });
  }
};

// GET /api/admin/dashboard
const getAdminDashboard = async (req, res) => {
  try {
    const [offices, employees, todayQueue, recentLogs] = await Promise.all([
      query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active) as active FROM offices'),
      query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active) as active FROM employees'),
      query(`SELECT SUM(q.total_tokens_issued) as tokens, SUM(q.current_token) as served
             FROM queues q WHERE q.date = CURRENT_DATE`),
      query(`SELECT al.*, o.name as office_name FROM audit_logs al LEFT JOIN offices o ON al.office_id = o.id
             ORDER BY al.created_at DESC LIMIT 10`),
    ]);

    res.json({
      success: true,
      data: {
        offices: { total: parseInt(offices.rows[0].total), active: parseInt(offices.rows[0].active) },
        employees: { total: parseInt(employees.rows[0].total), active: parseInt(employees.rows[0].active) },
        todayTokens: parseInt(todayQueue.rows[0]?.tokens) || 0,
        todayServed: parseInt(todayQueue.rows[0]?.served) || 0,
        recentActivity: recentLogs.rows,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard', error: err.message });
  }
};

// POST /api/admin/announcements
const createAnnouncement = async (req, res) => {
  try {
    const { officeId, title, message, type, expiresAt } = req.body;
    const admin = req.user;
    const result = await query(
      `INSERT INTO announcements (office_id, title, message, type, created_by_admin, expires_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [officeId, title, message, type || 'info', admin.id, expiresAt || null]
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Announcement created' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create announcement', error: err.message });
  }
};

// GET /api/admin/live-queues
const getLiveQueues = async (req, res) => {
  try {
    const result = await query(
      `SELECT q.*, o.name as office_name, o.type as office_type,
        COUNT(qe.id) FILTER (WHERE qe.status = 'waiting') as waiting_count,
        COUNT(qe.id) FILTER (WHERE qe.status = 'completed') as completed_count
       FROM queues q JOIN offices o ON q.office_id = o.id
       LEFT JOIN queue_entries qe ON q.id = qe.queue_id
       WHERE q.date = CURRENT_DATE GROUP BY q.id, o.name, o.type ORDER BY o.name`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch live queues', error: err.message });
  }
};

module.exports = { getEmployees, createEmployee, resetEmployeePassword, deactivateEmployee, getAdminDashboard, createAnnouncement, getLiveQueues };
