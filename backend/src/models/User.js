const { getDb } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const db = getDb();
    const { name, email, password, phone } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await db.run(
      `INSERT INTO users (name, email, password_hash, phone, role)
       VALUES (?, ?, ?, ?, 'user')`,
      [name, email, hashedPassword, phone]
    );
    
    return this.findById(result.lastID);
  }

  static async findByEmail(email) {
    const db = getDb();
    return await db.get('SELECT * FROM users WHERE email = ?', [email]);
  }

  static async findById(id) {
    const db = getDb();
    return await db.get(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?',
      [id]
    );
  }

  static async comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }
}

module.exports = User;