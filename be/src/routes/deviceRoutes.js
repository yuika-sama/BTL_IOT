const express = require('express');
const deviceController = require('../controllers/deviceController');

const router = express.Router();

router.post('/:id/toggle', deviceController.toggleDevice);
router.post('/:id/toggle-auto', deviceController.toggleAutoMode);

module.exports = router;
