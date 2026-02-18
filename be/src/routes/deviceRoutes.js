const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const asyncHandler = require('../middleware/asyncHandler');
const Validator = require('../middleware/validator');

// Dashboard: Get all devices info
router.get('/info', asyncHandler(deviceController.getAllDevicesInfo));

// CRUD Operations (Admin)
router.get(
    '/',
    Validator.combine(
        Validator.validatePagination,
        Validator.validateSortOrder
    ),
    asyncHandler(deviceController.getAll)
);

router.get(
    '/:id',
    Validator.validateUUID('id'),
    asyncHandler(deviceController.getById)
);

router.post('/', asyncHandler(deviceController.create));

router.put(
    '/:id',
    Validator.validateUUID('id'),
    asyncHandler(deviceController.update)
);

router.delete(
    '/:id',
    Validator.validateUUID('id'),
    asyncHandler(deviceController.delete)
);

// Dashboard: Toggle device status (ON/OFF) - Manual mode (disables auto_toggle)
router.patch(
    '/:id/toggle',
    Validator.validateUUID('id'),
    asyncHandler(deviceController.toggleStatus)
);

// Dashboard: Toggle auto_toggle mode (AUTO/MANUAL)
router.patch(
    '/:id/auto-toggle',
    Validator.validateUUID('id'),
    asyncHandler(deviceController.toggleAutoMode)
);

module.exports = router;