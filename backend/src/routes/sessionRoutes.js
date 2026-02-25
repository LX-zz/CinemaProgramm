const express = require('express');
const sessionController = require('../controllers/sessionController');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', sessionController.getAllSessions);
router.get('/movie/:movieId', sessionController.getSessionsByMovie);
router.get('/:id', sessionController.getSessionById);
router.get('/:id/seats', sessionController.getAvailableSeats);
router.post('/', adminAuth, sessionController.createSession);

module.exports = router;