const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');
const asyncHandler = require('../middleware/asyncHandler');
const Validator = require('../middleware/validator');

// Dashboard: Get latest values for 4 sensors (temperature, humidity, light, dust)
router.get('/latest', asyncHandler(sensorController.getLatestValues));

// CRUD Operations (Admin)
router.get(
    '/',
    Validator.combine(
        Validator.validatePagination,
        Validator.validateSortOrder
    ),
    asyncHandler(sensorController.getAll)
);

router.get(
    '/:id',
    Validator.validateUUID('id'),
    asyncHandler(sensorController.getById)
);

router.post('/', asyncHandler(sensorController.create));

router.put(
    '/:id',
    Validator.validateUUID('id'),
    asyncHandler(sensorController.update)
);

router.delete(
    '/:id',
    Validator.validateUUID('id'),
    asyncHandler(sensorController.delete)
);

// Get sensors by device ID
router.get(
    '/device/:deviceId',
    Validator.validateUUID('deviceId'),
    asyncHandler(sensorController.getByDeviceId)
);

module.exports = router;