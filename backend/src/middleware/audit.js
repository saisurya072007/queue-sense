const { query } = require('../config/db');

const auditLog = async ({
  actorType = 'system',
  actorId = null,
  actorName = 'System',
  actorEmployeeId = null,
  officeId = null,
  officeName = null,
  action,
  actionCategory = 'general',
  oldValue = null,
  newValue = null,
  details = null,
  ipAddress = null,
  userAgent = null,
}) => {
  try {
    await query(
      `INSERT INTO audit_logs (
        actor_type, actor_id, actor_name, actor_employee_id,
        office_id, office_name, action, action_category,
        old_value, new_value, details, ip_address, user_agent
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        actorType, actorId, actorName, actorEmployeeId,
        officeId, officeName, action, actionCategory,
        oldValue ? String(oldValue) : null,
        newValue ? String(newValue) : null,
        details ? JSON.stringify(details) : null,
        ipAddress, userAgent
      ]
    );
  } catch (err) {
    // Don't throw - audit log failure shouldn't break the main flow
    console.error('Audit log error:', err.message);
  }
};

// Express middleware to auto-capture IP/UserAgent
const auditMiddleware = (action, category = 'general') => {
  return async (req, res, next) => {
    req.auditInfo = {
      action,
      actionCategory: category,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    next();
  };
};

module.exports = { auditLog, auditMiddleware };
