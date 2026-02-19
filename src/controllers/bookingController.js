const Booking = require('../models/Booking');
const Session = require('../models/Session');

exports.createBooking = async (req, res) => {
  try {
    const { sessionId, seatIds } = req.body;
    
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const totalPrice = session.base_price * seatIds.length;
    
    const bookingData = {
      userId: req.userId,
      sessionId,
      seatIds,
      totalPrice
    };

    const booking = await Booking.create(bookingData);
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.findByUser(req.userId);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.cancel(req.params.id, req.userId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or cannot be cancelled' });
    }
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTicket = async (req, res) => {
  try {
    const ticket = await Booking.getTicket(req.params.id, req.userId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};