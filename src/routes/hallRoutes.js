const express = require('express');
const hallController = require('../controllers/hallController');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', hallController.getAllHalls);
router.get('/:id', hallController.getHallById);
router.get('/:id/seats', hallController.getHallSeats);
router.post('/', adminAuth, hallController.createHall);

module.exports = router;