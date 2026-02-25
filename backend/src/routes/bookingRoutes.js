const express = require('express');
const bookingController = require('../controllers/bookingController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, bookingController.createBooking);
router.get('/my', auth, bookingController.getUserBookings);
router.get('/:id/ticket', auth, bookingController.getTicket);
router.delete('/:id', auth, bookingController.cancelBooking);

module.exports = router;