const { initDatabase, getDb } = require('./src/config/database');

async function createSessions() {
    // Используем тот же способ подключения, что и в бэкенде
    const db = await initDatabase();
    
    console.log('✅ Подключились к базе данных через бэкенд');

    // Проверяем залы
    const halls = await db.all('SELECT * FROM halls');
    console.log('Залы:', halls);

    // Проверяем фильмы
    const movies = await db.all('SELECT * FROM movies');
    console.log('Фильмы:', movies.map(m => ({ id: m.id, title: m.title })));

    if (halls.length === 0 || movies.length === 0) {
        console.log('❌ Нет залов или фильмов!');
        return;
    }

    console.log('\n📅 Создаем сеансы...');

    const sessions = [
        // Сто лет тому вперёд (id: 8)
        {
            movieId: 8,
            hallId: 1,
            startTime: '2024-03-25 18:00:00',
            endTime: '2024-03-25 20:20:00',
            basePrice: 400
        },
        {
            movieId: 8,
            hallId: 3,
            startTime: '2024-03-26 10:00:00',
            endTime: '2024-03-26 12:20:00',
            basePrice: 350
        },
        // Повелитель ветра (id: 6)
        {
            movieId: 6,
            hallId: 2,
            startTime: '2024-03-25 19:30:00',
            endTime: '2024-03-25 21:45:00',
            basePrice: 500
        },
        // Горничная (id: 1)
        {
            movieId: 1,
            hallId: 1,
            startTime: '2024-03-26 20:00:00',
            endTime: '2024-03-26 21:50:00',
            basePrice: 450
        },
        // Лёд 3 (id: 7)
        {
            movieId: 7,
            hallId: 3,
            startTime: '2024-03-26 18:30:00',
            endTime: '2024-03-26 20:50:00',
            basePrice: 600
        },
        // Мастер и Маргарита (id: 4)
        {
            movieId: 4,
            hallId: 2,
            startTime: '2024-03-27 19:00:00',
            endTime: '2024-03-27 21:37:00',
            basePrice: 550
        }
    ];

    let created = 0;
    for (const s of sessions) {
        // Проверяем, существует ли уже такой сеанс
        const existing = await db.get(
            'SELECT id FROM sessions WHERE movie_id = ? AND hall_id = ? AND start_time = ?',
            [s.movieId, s.hallId, s.startTime]
        );

        if (!existing) {
            await db.run(
                `INSERT INTO sessions (movie_id, hall_id, start_time, end_time, base_price)
                 VALUES (?, ?, ?, ?, ?)`,
                [s.movieId, s.hallId, s.startTime, s.endTime, s.basePrice]
            );
            console.log(`  ✓ Сеанс создан: фильм ${s.movieId} в зале ${s.hallId} в ${s.startTime}`);
            created++;
        } else {
            console.log(`  → Сеанс уже существует: фильм ${s.movieId} в зале ${s.hallId}`);
        }
    }

    console.log(`\n✅ Создано новых сеансов: ${created}`);

    // Проверяем все сеансы
    const allSessions = await db.all(`
        SELECT s.*, m.title as movie_title, h.name as hall_name 
        FROM sessions s
        JOIN movies m ON s.movie_id = m.id
        JOIN halls h ON s.hall_id = h.id
        ORDER BY s.start_time
    `);

    console.log('\n📋 Все сеансы в базе:');
    allSessions.forEach(s => {
        console.log(`   ${s.movie_title} - ${s.hall_name} - ${s.start_time} - ${s.base_price}₽`);
    });

    process.exit(0);
}

createSessions().catch(console.error);