const { getDb } = require('../config/database');
const QRCode = require('qrcode');

class Booking {
  static async create(bookingData) {
    const db = getDb();
    const { userId, sessionId, seatIds, totalPrice } = bookingData;
    
    await db.run('BEGIN TRANSACTION');
    
    try {
      const bookingResult = await db.run(
        `INSERT INTO bookings (user_id, session_id, total_price, status)
         VALUES (?, ?, ?, 'confirmed')`,
        [userId, sessionId, totalPrice]
      );
      
      const bookingId = bookingResult.lastID;
      
      for (const seatId of seatIds) {
        await db.run(
          'INSERT INTO booked_seats (booking_id, seat_id) VALUES (?, ?)',
          [bookingId, seatId]
        );
      }
      
      const qrData = JSON.stringify({
        bookingId,
        sessionId,
        seats: seatIds,
        timestamp: new Date()
      });
      
      const qrCode = await QRCode.toDataURL(qrData);
      
      await db.run(
        'INSERT INTO tickets (booking_id, qr_code) VALUES (?, ?)',
        [bookingId, qrCode]
      );
      
      await db.run('COMMIT');
      
      return { bookingId, qrCode };
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }

  static async findByUser(userId) {
    const db = getDb();
    
    const bookings = await db.all(`
      SELECT b.*, s.start_time, m.title as movie_title, h.name as hall_name
      FROM bookings b
      JOIN sessions s ON b.session_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN halls h ON s.hall_id = h.id
      WHERE b.user_id = ?
      ORDER BY b.booking_time DESC
    `, [userId]);
    
    for (const booking of bookings) {
      const seats = await db.all(`
        SELECT seats.row_number, seats.seat_number
        FROM booked_seats
        JOIN seats ON booked_seats.seat_id = seats.id
        WHERE booked_seats.booking_id = ?
      `, [booking.id]);
      
      booking.seats = seats;
    }
    
    return bookings;
  }

  static async cancel(bookingId, userId) {
    const db = getDb();
    
    const result = await db.run(
      `UPDATE bookings 
       SET status = 'cancelled' 
       WHERE id = ? AND user_id = ? AND status = 'confirmed'`,
      [bookingId, userId]
    );
    
    return result.changes > 0 ? { id: bookingId } : null;
  }

  static async getTicket(bookingId, userId) {
    const db = getDb();
    
    return await db.get(`
      SELECT t.*, b.status
      FROM tickets t
      JOIN bookings b ON t.booking_id = b.id
      WHERE t.booking_id = ? AND b.user_id = ?
    `, [bookingId, userId]);
  }
}

module.exports = Booking;