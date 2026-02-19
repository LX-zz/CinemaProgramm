const { initDatabase, getDb } = require('./database');
const bcrypt = require('bcryptjs');
const Hall = require('../models/Hall');

const seedDatabase = async () => {
  await initDatabase();
  const db = getDb();

  try {
    console.log('Seeding database...');

    // Создаем админа
    const adminPassword = await bcrypt.hash('admin123', 10);
    await db.run(
      `INSERT OR IGNORE INTO users (name, email, password_hash, role) 
       VALUES (?, ?, ?, ?)`,
      ['Admin', 'admin@cinema.com', adminPassword, 'admin']
    );

    // Создаем тестового пользователя
    const userPassword = await bcrypt.hash('user123', 10);
    await db.run(
      `INSERT OR IGNORE INTO users (name, email, password_hash, role) 
       VALUES (?, ?, ?, ?)`,
      ['Test User', 'user@test.com', userPassword, 'user']
    );

    // Создаем залы
    const halls = [
      { name: 'Зал 1', type: 'Стандарт', totalRows: 8, totalSeats: 64 },
      { name: 'Зал 2', type: 'VIP', totalRows: 6, totalSeats: 36 },
      { name: 'Зал 3', type: 'IMAX', totalRows: 10, totalSeats: 120 }
    ];

    for (const hall of halls) {
      const exists = await db.get('SELECT id FROM halls WHERE name = ?', [hall.name]);
      if (!exists) {
        await Hall.create(hall);
        console.log(`Created hall: ${hall.name}`);
      }
    }

    // Добавляем тестовые фильмы
    const movies = [
      {
        title: 'Дюна: Часть вторая',
        description: 'Продолжение эпической саги о Поле Атрейдесе',
        genre: 'Фантастика',
        durationMin: 166,
        posterUrl: 'https://example.com/dune2.jpg',
        releaseDate: '2024-03-01'
      },
      {
        title: 'Мастер и Маргарита',
        description: 'Экранизация великого романа Булгакова',
        genre: 'Драма',
        durationMin: 157,
        posterUrl: 'https://example.com/master.jpg',
        releaseDate: '2024-01-25'
      },
      {
        title: 'Холоп 2',
        description: 'Продолжение популярной комедии',
        genre: 'Комедия',
        durationMin: 120,
        posterUrl: 'https://example.com/khollop2.jpg',
        releaseDate: '2024-01-01'
      }
    ];

    for (const movie of movies) {
      const exists = await db.get('SELECT id FROM movies WHERE title = ?', [movie.title]);
      if (!exists) {
        await db.run(
          `INSERT INTO movies (title, description, genre, duration_min, poster_url, release_date)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [movie.title, movie.description, movie.genre, movie.durationMin, movie.posterUrl, movie.releaseDate]
        );
        console.log(`Created movie: ${movie.title}`);
      }
    }

    console.log('Database seeded successfully!');
    console.log('\nTest credentials:');
    console.log('Admin: admin@cinema.com / admin123');
    console.log('User: user@test.com / user123');

  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

// Запускаем если файл вызван напрямую
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;