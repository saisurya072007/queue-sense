const express = require('express');
const router = express.Router();
const { getEmployees, createEmployee, resetEmployeePassword, deactivateEmployee, getAdminDashboard, createAnnouncement, getLiveQueues } = require('../controllers/adminController');
const { requireSuperAdmin } = require('../middleware/auth');

router.use(requireSuperAdmin);
router.get('/dashboard', getAdminDashboard);
router.get('/employees', getEmployees);
router.post('/employees', createEmployee);
router.put('/employees/:id/reset-password', resetEmployeePassword);
router.delete('/employees/:id', deactivateEmployee);
router.post('/announcements', createAnnouncement);
router.get('/live-queues', getLiveQueues);

module.exports = router;
