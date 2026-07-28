const { query } = require('../config/db');
const { auditLog } = require('../middleware/audit');
const axios = require('axios');
require('dotenv').config();

// Helper: Get or create today's queue
const getOrCreateQueue = async (officeId) => {
  const today = new Date().toISOString().split('T')[0];
  let result = await query(
    'SELECT * FROM queues WHERE office_id = $1 AND date = $2',
    [officeId, today]
  );
  if (result.rows.length === 0) {
    result = await query(
      `INSERT INTO queues (office_id, date, current_token, status) VALUES ($1, $2, 0, 'not_started') RETURNING *`,
      [officeId, today]
    );
  }
  return result.rows[0];
};

// Helper: Crowd level from count
const getCrowdLevel = (waitingCount) => {
  if (waitingCount <= 5) return { level: 'low', label: 'Low', color: '#10b981', emoji: '🟢' };
  if (waitingCount <= 15) return { level: 'medium', label: 'Moderate', color: '#f59e0b', emoji: '🟡' };
  if (waitingCount <= 30) return { level: 'high', label: 'High', color: '#ef4444', emoji: '🔴' };
  return { level: 'very_high', label: 'Very High', color: '#7c3aed', emoji: '🔴' };
};

// GET /api/queue/:officeId/status
const getQueueStatus = async (req, res) => {
  try {
    const { officeId } = req.params;
    const queue = await getOrCreateQueue(officeId);

    // Get waiting count
    const waitingResult = await query(
      `SELECT COUNT(*) as count FROM queue_entries WHERE queue_id = $1 AND status = 'waiting'`,
      [queue.id]
    );
    const waitingCount = parseInt(waitingResult.rows[0].count);

    // Get office info
    const officeResult = await query(
      'SELECT name, working_hours, lunch_break, phone FROM offices WHERE id = $1',
      [officeId]
    );
    const office = officeResult.rows[0];

    // Get announcements
    const announcementsResult = await query(
      `SELECT title, message, type FROM announcements WHERE office_id = $1 AND is_active = true AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY created_at DESC LIMIT 3`,
      [officeId]
    );

    // Average service time (from today's completed)
    const avgResult = await query(
      `SELECT AVG(service_minutes) as avg_service FROM queue_entries 
       WHERE queue_id = $1 AND status = 'completed' AND service_minutes IS NOT NULL`,
      [queue.id]
    );
    const avgServiceMinutes = parseFloat(avgResult.rows[0].avg_service) || 8;

    const crowd = getCrowdLevel(waitingCount);

    res.json({
      success: true,
      data: {
        queue: {
          id: queue.id,
          date: queue.date,
          currentToken: queue.current_token,
          totalTokensIssued: queue.total_tokens_issued,
          isPaused: queue.is_paused,
          status: queue.status,
          pauseReason: queue.pause_reason,
        },
        waitingCount,
        crowd,
        avgServiceMinutes: Math.round(avgServiceMinutes),
        office: {
          name: office?.name,
          workingHours: office?.working_hours,
          lunchBreak: office?.lunch_break,
          phone: office?.phone,
        },
        announcements: announcementsResult.rows,
        lastUpdated: new Date().toISOString(),
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch queue status', error: err.message });
  }
};

// GET /api/queue/:officeId/predict?token=X
const getPrediction = async (req, res) => {
  try {
    const { officeId } = req.params;
    const { token } = req.query;

    const queue = await getOrCreateQueue(officeId);
    const currentToken = queue.current_token;
    const tokenNumber = parseInt(token) || 0;
    const position = Math.max(0, tokenNumber - currentToken);

    // Get avg service time
    const avgResult = await query(
      `SELECT AVG(avg_service_minutes) as avg FROM historical_data WHERE office_id = $1 AND hour = EXTRACT(HOUR FROM NOW())::INTEGER`,
      [officeId]
    );
    const avgService = parseFloat(avgResult.rows[0].avg) || 8;

    // Try AI service
    let aiPrediction = null;
    try {
      const now = new Date();
      const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/predict`, {
        office_id: officeId,
        hour: now.getHours(),
        day_of_week: now.getDay(),
        is_holiday: false,
        token_number: tokenNumber,
        current_token: currentToken,
        position_in_queue: position,
      }, { timeout: 3000 });
      aiPrediction = aiResponse.data;
    } catch (aiErr) {
      // Fallback: rule-based prediction
    }

    const estimatedWait = aiPrediction?.predicted_wait_minutes || Math.round(position * avgService);
    const expectedCallTime = new Date(Date.now() + estimatedWait * 60 * 1000);

    // Best time to visit (off-peak)
    const currentHour = new Date().getHours();
    let bestTime = '9:00 AM - 10:00 AM';
    if (currentHour < 10) bestTime = 'Right now - Low crowd!';
    else if (currentHour >= 10 && currentHour < 12) bestTime = 'After 2:00 PM (post-lunch)';
    else if (currentHour >= 12 && currentHour < 14) bestTime = 'After 2:30 PM (avoid lunch rush)';
    else if (currentHour >= 14 && currentHour < 16) bestTime = 'This time is peak - try tomorrow 9:00 AM';
    else bestTime = 'Near closing - try tomorrow morning';

    // Get waiting count for crowd
    const waitingResult = await query(
      `SELECT COUNT(*) as count FROM queue_entries WHERE queue_id = $1 AND status = 'waiting'`,
      [queue.id]
    );
    const waitingCount = parseInt(waitingResult.rows[0].count);
    const crowd = getCrowdLevel(waitingCount);

    res.json({
      success: true,
      data: {
        tokenNumber: tokenNumber,
        currentToken: currentToken,
        position: position,
        estimatedWaitMinutes: estimatedWait,
        expectedCallTime: expectedCallTime.toISOString(),
        crowdLevel: crowd,
        bestTimeToVisit: bestTime,
        aiPowered: !!aiPrediction,
        confidence: aiPrediction?.confidence || 72,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get prediction', error: err.message });
  }
};

// PUT /api/queue/:officeId/update-token (Employee only)
const updateCurrentToken = async (req, res) => {
  try {
    const { officeId } = req.params;
    const { token, notes } = req.body;
    const employee = req.user;

    // Verify employee belongs to this office
    if (employee.officeId !== officeId && employee.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'You can only update your assigned office queue' });
    }

    const queue = await getOrCreateQueue(officeId);
    const oldToken = queue.current_token;

    if (parseInt(token) <= oldToken) {
      return res.status(400).json({ success: false, message: 'New token must be greater than current token' });
    }

    // Update queue
    await query(
      `UPDATE queues SET current_token = $1, status = 'active' WHERE id = $2`,
      [token, queue.id]
    );

    // Update called queue entry
    await query(
      `UPDATE queue_entries SET status = 'called', called_at = NOW() WHERE queue_id = $1 AND token_number = $2 AND status = 'waiting'`,
      [queue.id, token]
    );

    // Mark old tokens as skipped if gap
    if (parseInt(token) > oldToken + 1) {
      await query(
        `UPDATE queue_entries SET status = 'skipped' WHERE queue_id = $1 AND token_number > $2 AND token_number < $3 AND status = 'waiting'`,
        [queue.id, oldToken, token]
      );
    }

    // Audit log
    await auditLog({
      actorType: 'employee',
      actorId: employee.id,
      actorName: employee.username,
      actorEmployeeId: employee.employeeId,
      officeId,
      action: 'UPDATE_TOKEN',
      actionCategory: 'queue_management',
      oldValue: oldToken,
      newValue: token,
      details: { notes, queueId: queue.id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: `Token updated to ${token}`,
      data: { oldToken, newToken: token }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update token', error: err.message });
  }
};

// PUT /api/queue/:officeId/pause (Employee only)
const pauseQueue = async (req, res) => {
  try {
    const { officeId } = req.params;
    const { reason } = req.body;
    const employee = req.user;

    const queue = await getOrCreateQueue(officeId);
    await query(
      `UPDATE queues SET is_paused = true, status = 'paused', pause_reason = $1 WHERE id = $2`,
      [reason || 'Paused by staff', queue.id]
    );

    await auditLog({
      actorType: 'employee', actorId: employee.id, actorName: employee.username,
      actorEmployeeId: employee.employeeId, officeId,
      action: 'PAUSE_QUEUE', actionCategory: 'queue_management',
      details: { reason, queueId: queue.id }, ipAddress: req.ip, userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, message: 'Queue paused', data: { reason } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to pause queue', error: err.message });
  }
};

// PUT /api/queue/:officeId/resume (Employee only)
const resumeQueue = async (req, res) => {
  try {
    const { officeId } = req.params;
    const employee = req.user;

    const queue = await getOrCreateQueue(officeId);
    await query(
      `UPDATE queues SET is_paused = false, status = 'active', pause_reason = NULL WHERE id = $1`,
      [queue.id]
    );

    await auditLog({
      actorType: 'employee', actorId: employee.id, actorName: employee.username,
      actorEmployeeId: employee.employeeId, officeId,
      action: 'RESUME_QUEUE', actionCategory: 'queue_management',
      details: { queueId: queue.id }, ipAddress: req.ip, userAgent: req.headers['user-agent'],
    });

    res.json({ success: true, message: 'Queue resumed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to resume queue', error: err.message });
  }
};

// POST /api/queue/:officeId/join (Citizen)
const joinQueue = async (req, res) => {
  try {
    const { officeId } = req.params;
    const { citizenName, citizenPhone, serviceId } = req.body;

    const queue = await getOrCreateQueue(officeId);
    if (queue.is_paused) {
      return res.status(400).json({ success: false, message: 'Queue is currently paused. Please try again later.' });
    }

    // Get next token
    const newToken = queue.total_tokens_issued + 1;
    await query(`UPDATE queues SET total_tokens_issued = $1 WHERE id = $2`, [newToken, queue.id]);

    // Count waiting
    const posResult = await query(
      `SELECT COUNT(*) as count FROM queue_entries WHERE queue_id = $1 AND status = 'waiting'`,
      [queue.id]
    );
    const position = parseInt(posResult.rows[0].count) + 1;

    // Insert entry
    await query(
      `INSERT INTO queue_entries (queue_id, office_id, token_number, citizen_name, citizen_phone, service_id, status, position_at_join)
       VALUES ($1,$2,$3,$4,$5,$6,'waiting',$7)`,
      [queue.id, officeId, newToken, citizenName, citizenPhone, serviceId || null, position]
    );

    res.status(201).json({
      success: true,
      message: 'Successfully joined queue',
      data: { tokenNumber: newToken, position, queueId: queue.id }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to join queue', error: err.message });
  }
};

// GET /api/queue/:officeId/history
const getQueueHistory = async (req, res) => {
  try {
    const { officeId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const result = await query(
      `SELECT q.date, q.current_token, q.total_tokens_issued,
        COUNT(qe.id) FILTER (WHERE qe.status = 'completed') as completed,
        COUNT(qe.id) FILTER (WHERE qe.status = 'waiting') as waiting,
        AVG(qe.wait_minutes) as avg_wait
       FROM queues q LEFT JOIN queue_entries qe ON q.id = qe.queue_id
       WHERE q.office_id = $1 GROUP BY q.id, q.date, q.current_token, q.total_tokens_issued
       ORDER BY q.date DESC LIMIT $2 OFFSET $3`,
      [officeId, limit, offset]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch queue history', error: err.message });
  }
};

module.exports = { getQueueStatus, getPrediction, updateCurrentToken, pauseQueue, resumeQueue, joinQueue, getQueueHistory };
