const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const asyncHandler = require('../middleware/asyncHandler');
const Validator = require('../middleware/validator');

// Notification Page: Get all alerts with pagination, search, filters
router.get(
    '/',
    Validator.combine(
        Validator.validatePagination,
        Validator.validateSortOrder,
        Validator.validateDateRange
    ),
    asyncHandler(alertController.getAll)
);

// Get statistics
router.get('/statistics', asyncHandler(alertController.getStatistics));

module.exports = router;