const { getDb } = require('../config/database');

class Movie {
  static async create(movieData) {
    const db = getDb();
    const { title, description, genre, durationMin, posterUrl, releaseDate } = movieData;
    
    const result = await db.run(
      `INSERT INTO movies (title, description, genre, duration_min, poster_url, release_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description, genre, durationMin, posterUrl, releaseDate]
    );
    
    return this.findById(result.lastID);
  }

  static async findAll() {
    const db = getDb();
    return await db.all('SELECT * FROM movies ORDER BY release_date DESC');
  }

  static async findById(id) {
    const db = getDb();
    return await db.get('SELECT * FROM movies WHERE id = ?', [id]);
  }

  static async update(id, movieData) {
    const db = getDb();
    const { title, description, genre, durationMin, posterUrl, releaseDate } = movieData;
    
    await db.run(
      `UPDATE movies 
       SET title = ?, description = ?, genre = ?, duration_min = ?, 
           poster_url = ?, release_date = ?
       WHERE id = ?`,
      [title, description, genre, durationMin, posterUrl, releaseDate, id]
    );
    
    return this.findById(id);
  }

  static async delete(id) {
    const db = getDb();
    await db.run('DELETE FROM movies WHERE id = ?', [id]);
    return true;
  }
}

module.exports = Movie;