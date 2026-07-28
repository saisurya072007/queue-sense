const express = require('express');
const router = express.Router();
const { getAnalyticsOverview, getAllOfficesAnalytics, getAuditLogs } = require('../controllers/analyticsController');
const { requireSuperAdmin } = require('../middleware/auth');

router.get('/office/:officeId', getAnalyticsOverview);
router.get('/admin/all', requireSuperAdmin, getAllOfficesAnalytics);
router.get('/admin/logs', requireSuperAdmin, getAuditLogs);

module.exports = router;
