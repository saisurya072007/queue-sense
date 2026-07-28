const { query } = require('../config/db');

// GET /api/analytics/:officeId/overview
const getAnalyticsOverview = async (req, res) => {
  try {
    const { officeId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    // Today's stats
    const todayResult = await query(
      `SELECT SUM(visitor_count) as visitors, SUM(tokens_served) as served, AVG(avg_wait_minutes) as avg_wait
       FROM historical_data WHERE office_id = $1 AND date = $2`,
      [officeId, today]
    );

    // Last 7 days
    const weekResult = await query(
      `SELECT date, SUM(visitor_count) as visitors, AVG(avg_wait_minutes) as avg_wait
       FROM historical_data WHERE office_id = $1 AND date >= NOW() - INTERVAL '7 days'
       GROUP BY date ORDER BY date ASC`,
      [officeId]
    );

    // Last 30 days
    const monthResult = await query(
      `SELECT date, SUM(visitor_count) as visitors, AVG(avg_wait_minutes) as avg_wait
       FROM historical_data WHERE office_id = $1 AND date >= NOW() - INTERVAL '30 days'
       GROUP BY date ORDER BY date ASC`,
      [officeId]
    );

    // Peak hours (avg visitors by hour)
    const peakHoursResult = await query(
      `SELECT hour, AVG(visitor_count) as avg_visitors, AVG(avg_wait_minutes) as avg_wait
       FROM historical_data WHERE office_id = $1 AND date >= NOW() - INTERVAL '30 days'
       GROUP BY hour ORDER BY hour ASC`,
      [officeId]
    );

    // Busiest day of week
    const busiestDayResult = await query(
      `SELECT day_of_week, AVG(visitor_count) as avg_visitors
       FROM historical_data WHERE office_id = $1 AND date >= NOW() - INTERVAL '30 days'
       GROUP BY day_of_week ORDER BY avg_visitors DESC`,
      [officeId]
    );

    // Monthly summary (last 6 months)
    const monthlyResult = await query(
      `SELECT TO_CHAR(date, 'YYYY-MM') as month, SUM(visitor_count) as visitors, AVG(avg_wait_minutes) as avg_wait
       FROM historical_data WHERE office_id = $1 AND date >= NOW() - INTERVAL '6 months'
       GROUP BY TO_CHAR(date, 'YYYY-MM') ORDER BY month ASC`,
      [officeId]
    );

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const busiest = busiestDayResult.rows[0];
    const fastest = busiestDayResult.rows[busiestDayResult.rows.length - 1];

    res.json({
      success: true,
      data: {
        today: {
          visitors: parseInt(todayResult.rows[0]?.visitors) || 0,
          tokensServed: parseInt(todayResult.rows[0]?.served) || 0,
          avgWait: Math.round(parseFloat(todayResult.rows[0]?.avg_wait) || 0),
        },
        last7Days: weekResult.rows.map(r => ({
          date: r.date, visitors: parseInt(r.visitors), avgWait: Math.round(parseFloat(r.avg_wait))
        })),
        last30Days: monthResult.rows.map(r => ({
          date: r.date, visitors: parseInt(r.visitors), avgWait: Math.round(parseFloat(r.avg_wait))
        })),
        peakHours: peakHoursResult.rows.map(r => ({
          hour: parseInt(r.hour),
          label: `${r.hour}:00`,
          avgVisitors: Math.round(parseFloat(r.avg_visitors)),
          avgWait: Math.round(parseFloat(r.avg_wait)),
        })),
        busiestDay: busiest ? { day: dayNames[busiest.day_of_week], avgVisitors: Math.round(parseFloat(busiest.avg_visitors)) } : null,
        fastestDay: fastest ? { day: dayNames[fastest.day_of_week], avgVisitors: Math.round(parseFloat(fastest.avg_visitors)) } : null,
        leastCrowdedHour: peakHoursResult.rows.reduce((min, r) => parseFloat(r.avg_visitors) < parseFloat(min.avg_visitors) ? r : min, peakHoursResult.rows[0] || { hour: 9, avg_visitors: 0 }),
        monthly: monthlyResult.rows.map(r => ({
          month: r.month, visitors: parseInt(r.visitors), avgWait: Math.round(parseFloat(r.avg_wait))
        })),
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch analytics', error: err.message });
  }
};

// GET /api/analytics/admin/all (Admin - all offices)
const getAllOfficesAnalytics = async (req, res) => {
  try {
    const result = await query(
      `SELECT o.id, o.name, o.type,
        SUM(h.visitor_count) as total_visitors_30d,
        AVG(h.avg_wait_minutes) as avg_wait_30d,
        COUNT(DISTINCT e.id) as employee_count
       FROM offices o
       LEFT JOIN historical_data h ON o.id = h.office_id AND h.date >= NOW() - INTERVAL '30 days'
       LEFT JOIN employees e ON o.id = e.office_id AND e.is_active = true
       WHERE o.is_active = true
       GROUP BY o.id, o.name, o.type ORDER BY total_visitors_30d DESC NULLS LAST`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin analytics', error: err.message });
  }
};

// GET /api/analytics/admin/logs
const getAuditLogs = async (req, res) => {
  try {
    const { officeId, actorId, limit = 100, offset = 0, startDate, endDate } = req.query;
    let sql = `SELECT al.*, o.name as office_name FROM audit_logs al LEFT JOIN offices o ON al.office_id = o.id WHERE 1=1`;
    const params = [];
    if (officeId) { params.push(officeId); sql += ` AND al.office_id = $${params.length}`; }
    if (actorId) { params.push(actorId); sql += ` AND al.actor_id = $${params.length}`; }
    if (startDate) { params.push(startDate); sql += ` AND al.created_at >= $${params.length}`; }
    if (endDate) { params.push(endDate); sql += ` AND al.created_at <= $${params.length}`; }
    sql += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs', error: err.message });
  }
};

module.exports = { getAnalyticsOverview, getAllOfficesAnalytics, getAuditLogs };
