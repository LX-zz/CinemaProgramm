const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

async function setupAll() {
    console.log('🚀 Начинаем полную настройку...');
    
    // Удаляем старую базу если есть
    const fs = require('fs');
    const dbPath = path.join(__dirname, 'cinema.sqlite');
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        console.log('✅ Старая база удалена');
    }

    // Создаем новую базу
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    console.log('✅ Создана новая база данных');

    // Создаем таблицы
    await db.exec(`
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            phone TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE halls (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT,
            total_rows INTEGER NOT NULL,
            total_seats INTEGER NOT NULL
        );

        CREATE TABLE seats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hall_id INTEGER,
            row_number INTEGER NOT NULL,
            seat_number INTEGER NOT NULL,
            type TEXT DEFAULT 'standard',
            FOREIGN KEY (hall_id) REFERENCES halls (id) ON DELETE CASCADE,
            UNIQUE(hall_id, row_number, seat_number)
        );

        CREATE TABLE movies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            genre TEXT,
            duration_min INTEGER NOT NULL,
            poster_url TEXT,
            release_date DATE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE sessions (
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

        CREATE TABLE bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            session_id INTEGER,
            status TEXT DEFAULT 'confirmed',
            booking_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            total_price DECIMAL(10, 2) NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
        );

        CREATE TABLE booked_seats (
            booking_id INTEGER,
            seat_id INTEGER,
            PRIMARY KEY (booking_id, seat_id),
            FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE,
            FOREIGN KEY (seat_id) REFERENCES seats (id) ON DELETE CASCADE
        );
    `);

    console.log('✅ Таблицы созданы');

    // Создаем админа
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.run(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        ['Admin', 'admin@cinema.com', hashedPassword, 'admin']
    );
    console.log('✅ Админ создан');

    // Создаем залы
    const halls = [
        { name: 'Зал 1 (Синий)', type: 'Стандарт', totalRows: 10, totalSeats: 160 },
        { name: 'Зал 2 (Красный)', type: 'VIP', totalRows: 8, totalSeats: 120 },
        { name: 'Зал 3 (Золотой)', type: 'IMAX', totalRows: 12, totalSeats: 192 }
    ];

    for (const hall of halls) {
        const result = await db.run(
            'INSERT INTO halls (name, type, total_rows, total_seats) VALUES (?, ?, ?, ?)',
            [hall.name, hall.type, hall.totalRows, hall.totalSeats]
        );
        
        // Создаем места для зала
        const hallId = result.lastID;
        const seatsPerRow = hall.totalSeats / hall.totalRows;
        
        for (let row = 1; row <= hall.totalRows; row++) {
            for (let seat = 1; seat <= seatsPerRow; seat++) {
                await db.run(
                    'INSERT INTO seats (hall_id, row_number, seat_number) VALUES (?, ?, ?)',
                    [hallId, row, seat]
                );
            }
        }
        console.log(`✅ Зал "${hall.name}" создан с местами`);
    }

    // Создаем фильмы
    const movies = [
        {
            title: 'Сто лет тому вперёд',
            description: 'Фантастическая история по мотивам повести Кира Булычева о приключениях Алисы Селезневой.',
            genre: 'Фантастика',
            durationMin: 140,
            releaseDate: '2024-04-18'
        },
        {
            title: 'Повелитель ветра',
            description: 'Фильм о путешествии Федора Конюхова вокруг света на воздушном шаре.',
            genre: 'Приключения',
            durationMin: 135,
            releaseDate: '2024-02-22'
        },
        {
            title: 'Горничная',
            description: 'Драматическая история о девушке, которая работает горничной в элитном отеле.',
            genre: 'Драма',
            durationMin: 110,
            releaseDate: '2024-02-15'
        }
    ];

    for (const movie of movies) {
        await db.run(
            'INSERT INTO movies (title, description, genre, duration_min, release_date) VALUES (?, ?, ?, ?, ?)',
            [movie.title, movie.description, movie.genre, movie.durationMin, movie.releaseDate]
        );
        console.log(`✅ Фильм "${movie.title}" создан`);
    }

    // Создаем сеансы
    const sessions = [
        { movieId: 1, hallId: 1, startTime: '2024-03-25 18:00:00', endTime: '2024-03-25 20:20:00', price: 400 },
        { movieId: 1, hallId: 3, startTime: '2024-03-26 10:00:00', endTime: '2024-03-26 12:20:00', price: 350 },
        { movieId: 2, hallId: 2, startTime: '2024-03-25 19:30:00', endTime: '2024-03-25 21:45:00', price: 500 },
        { movieId: 3, hallId: 1, startTime: '2024-03-26 20:00:00', endTime: '2024-03-26 21:50:00', price: 450 }
    ];

    for (const s of sessions) {
        await db.run(
            'INSERT INTO sessions (movie_id, hall_id, start_time, end_time, base_price) VALUES (?, ?, ?, ?, ?)',
            [s.movieId, s.hallId, s.startTime, s.endTime, s.price]
        );
        console.log(`✅ Сеанс для фильма ${s.movieId} в зале ${s.hallId} создан`);
    }

    // Проверяем результат
    console.log('\n📊 ПРОВЕРКА:');
    
    const moviesCount = await db.get('SELECT COUNT(*) as count FROM movies');
    console.log(`Фильмов: ${moviesCount.count}`);
    
    const hallsCount = await db.get('SELECT COUNT(*) as count FROM halls');
    console.log(`Залoв: ${hallsCount.count}`);
    
    const sessionsCount = await db.get('SELECT COUNT(*) as count FROM sessions');
    console.log(`Сеансов: ${sessionsCount.count}`);
    
    const allSessions = await db.all(`
        SELECT s.id, m.title as movie, h.name as hall, s.start_time, s.base_price
        FROM sessions s
        JOIN movies m ON s.movie_id = m.id
        JOIN halls h ON s.hall_id = h.id
    `);
    
    console.log('\n📅 Сеансы:');
    allSessions.forEach(s => {
        console.log(`   ${s.movie} - ${s.hall} - ${s.start_time} - ${s.base_price}₽`);
    });

    console.log('\n✅ ВСЕ ГОТОВО! Запускайте бэкенд и проверяйте:');
    console.log('   http://localhost:5001/api/movies');
    console.log('   http://localhost:5001/api/halls');
    console.log('   http://localhost:5001/api/sessions');
    
    await db.close();
}

setupAll().catch(console.error);