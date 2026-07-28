const express = require('express');
const router = express.Router();
const { getQueueStatus, getPrediction, updateCurrentToken, pauseQueue, resumeQueue, joinQueue, getQueueHistory } = require('../controllers/queueController');
const { requireEmployee } = require('../middleware/auth');

router.get('/:officeId/status', getQueueStatus);
router.get('/:officeId/predict', getPrediction);
router.get('/:officeId/history', getQueueHistory);
router.post('/:officeId/join', joinQueue);
router.put('/:officeId/update-token', requireEmployee, updateCurrentToken);
router.put('/:officeId/pause', requireEmployee, pauseQueue);
router.put('/:officeId/resume', requireEmployee, resumeQueue);

module.exports = router;
