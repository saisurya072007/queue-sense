const { query } = require('../config/db');
const { auditLog } = require('../middleware/audit');

// POST /api/employee/announcements
const createAnnouncement = async (req, res) => {
  try {
    const { title, message, type, expiresAt } = req.body;
    const employee = req.user;
    const officeId = employee.officeId;

    const result = await query(
      `INSERT INTO announcements (office_id, title, message, type, created_by_employee, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [officeId, title, message, type || 'info', employee.id, expiresAt || null]
    );

    await auditLog({
      actorType: 'employee', actorId: employee.id, actorName: employee.username,
      actorEmployeeId: employee.employeeId, officeId,
      action: 'CREATE_ANNOUNCEMENT', actionCategory: 'announcements',
      newValue: title, details: { type, message: message.substring(0, 100) },
      ipAddress: req.ip, userAgent: req.headers['user-agent'],
    });

    res.status(201).json({ success: true, data: result.rows[0], message: 'Announcement posted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to post announcement', error: err.message });
  }
};

// GET /api/employee/announcements
const getMyAnnouncements = async (req, res) => {
  try {
    const employee = req.user;
    const result = await query(
      `SELECT * FROM announcements WHERE office_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [employee.officeId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch announcements', error: err.message });
  }
};

// GET /api/employee/my-office-queue
const getMyOfficeQueue = async (req, res) => {
  try {
    const employee = req.user;
    const { officeId } = employee;
    const today = new Date().toISOString().split('T')[0];

    const queueResult = await query(
      'SELECT * FROM queues WHERE office_id = $1 AND date = $2',
      [officeId, today]
    );

    if (queueResult.rows.length === 0) {
      return res.json({ success: true, data: { queue: null, entries: [], stats: {} } });
    }

    const queue = queueResult.rows[0];
    const entriesResult = await query(
      `SELECT qe.*, s.name as service_name FROM queue_entries qe
       LEFT JOIN services s ON qe.service_id = s.id
       WHERE qe.queue_id = $1 ORDER BY qe.token_number DESC LIMIT 50`,
      [queue.id]
    );

    const statsResult = await query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'waiting') as waiting,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'called') as called,
        COUNT(*) FILTER (WHERE status = 'skipped') as skipped,
        AVG(wait_minutes) FILTER (WHERE status = 'completed') as avg_wait
       FROM queue_entries WHERE queue_id = $1`,
      [queue.id]
    );

    res.json({
      success: true,
      data: {
        queue,
        entries: entriesResult.rows,
        stats: statsResult.rows[0],
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch office queue', error: err.message });
  }
};

// GET /api/employee/activity
const getMyActivity = async (req, res) => {
  try {
    const employee = req.user;
    const result = await query(
      `SELECT * FROM audit_logs WHERE actor_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [employee.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch activity', error: err.message });
  }
};

module.exports = { createAnnouncement, getMyAnnouncements, getMyOfficeQueue, getMyActivity };
