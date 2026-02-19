const { getDb } = require('../config/database');

class Hall {
  static async create(hallData) {
    const db = getDb();
    const { name, type, totalRows, totalSeats } = hallData;
    
    await db.run('BEGIN TRANSACTION');
    
    try {
      const hallResult = await db.run(
        `INSERT INTO halls (name, type, total_rows, total_seats)
         VALUES (?, ?, ?, ?)`,
        [name, type, totalRows, totalSeats]
      );
      
      const hallId = hallResult.lastID;
      const seatsPerRow = Math.floor(totalSeats / totalRows);
      
      for (let row = 1; row <= totalRows; row++) {
        for (let seat = 1; seat <= seatsPerRow; seat++) {
          await db.run(
            'INSERT INTO seats (hall_id, row_number, seat_number) VALUES (?, ?, ?)',
            [hallId, row, seat]
          );
        }
      }
      
      await db.run('COMMIT');
      return { id: hallId, ...hallData };
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }

  static async findAll() {
    const db = getDb();
    return await db.all('SELECT * FROM halls');
  }

  static async findById(id) {
    const db = getDb();
    return await db.get('SELECT * FROM halls WHERE id = ?', [id]);
  }

  static async getSeats(hallId) {
    const db = getDb();
    return await db.all(
      'SELECT * FROM seats WHERE hall_id = ? ORDER BY row_number, seat_number',
      [hallId]
    );
  }
}

module.exports = Hall;