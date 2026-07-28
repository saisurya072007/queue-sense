const express = require('express');
const router = express.Router();
const { employeeLogin, adminLogin, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/employee/login', employeeLogin);
router.post('/admin/login', adminLogin);
router.get('/me', authenticate, getMe);

module.exports = router;
