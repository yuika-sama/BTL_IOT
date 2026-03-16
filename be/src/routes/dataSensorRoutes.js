const express = require('express');
const dataSensorController = require('../controllers/dataSensorController');

const router = express.Router();

router.get('/', dataSensorController.getSensorHistory);

module.exports = router;
