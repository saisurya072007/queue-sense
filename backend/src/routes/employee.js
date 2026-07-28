const express = require('express');
const router = express.Router();
const { createAnnouncement, getMyAnnouncements, getMyOfficeQueue, getMyActivity } = require('../controllers/employeeController');
const { requireEmployee } = require('../middleware/auth');

router.use(requireEmployee);
router.get('/my-queue', getMyOfficeQueue);
router.get('/announcements', getMyAnnouncements);
router.post('/announcements', createAnnouncement);
router.get('/activity', getMyActivity);

module.exports = router;
