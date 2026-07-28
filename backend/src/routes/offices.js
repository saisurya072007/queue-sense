const express = require('express');
const router = express.Router();
const { getOffices, getOfficeById, getOfficeServices, getServiceById, createOffice, updateOffice, createService } = require('../controllers/officeController');
const { requireSuperAdmin } = require('../middleware/auth');

router.get('/', getOffices);
router.get('/:id', getOfficeById);
router.get('/:id/services', getOfficeServices);
router.post('/', requireSuperAdmin, createOffice);
router.put('/:id', requireSuperAdmin, updateOffice);
router.post('/:id/services', requireSuperAdmin, createService);

module.exports = router;
