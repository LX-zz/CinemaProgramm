const express = require('express');
const sessionController = require('../controllers/sessionController');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', sessionController.getAllSessions);
router.get('/:id', sessionController.getSessionById);
router.get('/:id/seats', sessionController.getAvailableSeats);
router.post('/', adminAuth, sessionController.createSession);
router.put('/:id', adminAuth, sessionController.updateSession);
router.delete('/:id', adminAuth, sessionController.deleteSession);

module.exports = router;