const express = require('express');
const router = express.Router();
const dataSensorController = require('../controllers/dataSensorController');
const asyncHandler = require('../middleware/asyncHandler');
const Validator = require('../middleware/validator');

// Get initial chart data for all 4 sensors (temperature, humidity, light, dust)
router.get('/initial-chart-data', asyncHandler(dataSensorController.getInitialChartData));

// Data Sensor Page: Get history of 4 sensor types with pagination, search, filters
router.get(
    '/history',
    Validator.combine(
        Validator.validatePagination,
        Validator.validateSortOrder,
        Validator.validateDateRange
    ),
    asyncHandler(dataSensorController.getSensorHistory)
);

// Get aggregate data for charts
router.get(
    '/aggregate/:sensorId',
    Validator.combine(
        Validator.validateUUID('sensorId'),
        Validator.validateInterval
    ),
    asyncHandler(dataSensorController.getAggregateData)
);

module.exports = router;