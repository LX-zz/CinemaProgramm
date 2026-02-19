const { getDb } = require('../config/database');

class Session {
  static async create(sessionData) {
    const db = getDb();
    const { movieId, hallId, startTime, endTime, basePrice } = sessionData;
    
    const result = await db.run(
      `INSERT INTO sessions (movie_id, hall_id, start_time, end_time, base_price)
       VALUES (?, ?, ?, ?, ?)`,
      [movieId, hallId, startTime, endTime, basePrice]
    );
    
    return this.findById(result.lastID);
  }

  static async findAll() {
    const db = getDb();
    return await db.all(`
      SELECT s.*, m.title as movie_title, h.name as hall_name 
      FROM sessions s
      JOIN movies m ON s.movie_id = m.id
      JOIN halls h ON s.hall_id = h.id
      WHERE s.start_time > datetime('now')
      ORDER BY s.start_time
    `);
  }

  static async findById(id) {
    const db = getDb();
    return await db.get(`
      SELECT s.*, m.title as movie_title, h.name as hall_name 
      FROM sessions s
      JOIN movies m ON s.movie_id = m.id
      JOIN halls h ON s.hall_id = h.id
      WHERE s.id = ?
    `, [id]);
  }

  static async getAvailableSeats(sessionId) {
    const db = getDb();
    
    const session = await db.get(
      'SELECT hall_id FROM sessions WHERE id = ?',
      [sessionId]
    );
    
    if (!session) return [];
    
    return await db.all(`
      SELECT s.*, 
             CASE WHEN bs.seat_id IS NOT NULL THEN 1 ELSE 0 END as is_booked
      FROM seats s
      LEFT JOIN booked_seats bs ON bs.seat_id = s.id
      LEFT JOIN bookings b ON bs.booking_id = b.id AND b.status != 'cancelled'
      WHERE s.hall_id = ?
      ORDER BY s.row_number, s.seat_number
    `, [session.hall_id]);
  }
}

module.exports = Session;