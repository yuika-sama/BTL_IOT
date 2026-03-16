const express = require('express');
const actionHistoryController = require('../controllers/actionHistoryController');

const router = express.Router();

router.get('/', actionHistoryController.getAllActionHistory);
router.get('/daily-count', actionHistoryController.getDailyCount);
router.get('/count-by-days', actionHistoryController.getCountByDays);

module.exports = router;