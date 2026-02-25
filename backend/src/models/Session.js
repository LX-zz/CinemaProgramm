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

  static async findByMovie(movieId) {
    const db = getDb();
    return await db.all(`
      SELECT s.*, h.name as hall_name 
      FROM sessions s
      JOIN halls h ON s.hall_id = h.id
      WHERE s.movie_id = ? AND s.start_time > datetime('now')
      ORDER BY s.start_time
    `, [movieId]);
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
}

module.exports = Session;