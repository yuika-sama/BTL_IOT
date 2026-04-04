const express = require('express');
const deviceController = require('../controllers/deviceController');

const router = express.Router();

router.post('/:id/toggle', deviceController.toggleDevice);

module.exports = router;
