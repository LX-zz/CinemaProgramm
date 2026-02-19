const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let db;

const initDatabase = async () => {
  db = await open({
    filename: path.join(__dirname, '../../cinema.sqlite'),
    driver: sqlite3.Database
  });

  console.log('Connected to SQLite database');

  // Создаем таблицы - ВАЖНО: весь SQL внутри обратных кавычек!
  await db.exec(`
    -- Пользователи
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Залы
    CREATE TABLE IF NOT EXISTS halls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT,
      total_rows INTEGER NOT NULL,
      total_seats INTEGER NOT NULL
    );

    -- Места
    CREATE TABLE IF NOT EXISTS seats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hall_id INTEGER,
      row_number INTEGER NOT NULL,
      seat_number INTEGER NOT NULL,
      type TEXT DEFAULT 'standard',
      FOREIGN KEY (hall_id) REFERENCES halls (id) ON DELETE CASCADE,
      UNIQUE(hall_id, row_number, seat_number)
    );

    -- Фильмы
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      genre TEXT,
      duration_min INTEGER NOT NULL,
      poster_url TEXT,
      release_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Сеансы
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movie_id INTEGER,
      hall_id INTEGER,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      base_price DECIMAL(10, 2) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (movie_id) REFERENCES movies (id) ON DELETE CASCADE,
      FOREIGN KEY (hall_id) REFERENCES halls (id) ON DELETE CASCADE
    );

    -- Бронирования
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      session_id INTEGER,
      status TEXT DEFAULT 'pending',
      booking_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      total_price DECIMAL(10, 2) NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
    );

    -- Забронированные места
    CREATE TABLE IF NOT EXISTS booked_seats (
      booking_id INTEGER,
      seat_id INTEGER,
      PRIMARY KEY (booking_id, seat_id),
      FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
      FOREIGN KEY (seat_id) REFERENCES seats (id) ON DELETE CASCADE
    );

    -- Билеты
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER UNIQUE,
      qr_code TEXT,
      is_used BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE
    );
  `);

  console.log('Tables created successfully');
  return db;
};

const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};

module.exports = { initDatabase, getDb };