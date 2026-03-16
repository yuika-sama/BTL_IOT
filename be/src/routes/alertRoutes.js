const express = require('express');
const alertController = require('../controllers/alertController');

const router = express.Router();

router.get('/', alertController.getAllAlerts);
router.get('/daily-count', alertController.getDailyCount);
router.get('/count-by-days', alertController.getCountByDays);

module.exports = router;
