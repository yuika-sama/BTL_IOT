const express = require('express');
const router = express.Router();
const actionHistoryController = require('../controllers/actionHistoryController');
const asyncHandler = require('../middleware/asyncHandler');
const Validator = require('../middleware/validator');

// Action History Page: Get all action history with pagination, search, filters
router.get(
    '/',
    Validator.combine(
        Validator.validatePagination,
        Validator.validateSortOrder,
        Validator.validateDateRange
    ),
    asyncHandler(actionHistoryController.getAll)
);

// Get statistics
router.get('/statistics', asyncHandler(actionHistoryController.getStatistics));

module.exports = router;