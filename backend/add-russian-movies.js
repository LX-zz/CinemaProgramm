const { initDatabase, getDb } = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function addRussianMovies() {
    const db = await initDatabase();
    
    console.log('Добавляем фильмы из русской афиши...');
    
    // Проверяем есть ли админ
    const admin = await db.get('SELECT * FROM users WHERE email = ?', ['admin@cinema.com']);
    
    if (!admin) {
        // Создаем админа
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await db.run(
            'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            ['Admin', 'admin@cinema.com', hashedPassword, 'admin']
        );
        console.log('✓ Админ создан');
    }
    
    // Добавляем фильмы из русской афиши
    const movies = [
        {
            title: 'Горничная',
            description: 'Драматическая история о девушке, которая работает горничной в элитном отеле и мечтает изменить свою жизнь.',
            genre: 'Драма',
            durationMin: 110,
            posterUrl: 'https://example.com/gornichnaya.jpg',
            releaseDate: '2024-02-15'
        },
        {
            title: 'Холоп 2',
            description: 'Продолжение популярной комедии о мажоре, который попал в прошлое. Теперь его ждут новые приключения!',
            genre: 'Комедия',
            durationMin: 120,
            posterUrl: 'https://example.com/khollop2.jpg',
            releaseDate: '2024-01-01'
        },
        {
            title: 'Бременские музыканты',
            description: 'Новая экранизация любимой сказки о приключениях Трубадура и его друзей.',
            genre: 'Семейный',
            durationMin: 115,
            posterUrl: 'https://example.com/bremenskie.jpg',
            releaseDate: '2024-01-03'
        },
        {
            title: 'Мастер и Маргарита',
            description: 'Экранизация великого романа Булгакова. Воланд появляется в Москве 1930-х годов.',
            genre: 'Драма',
            durationMin: 157,
            posterUrl: 'https://example.com/master.jpg',
            releaseDate: '2024-01-25'
        },
        {
            title: 'Воздух',
            description: 'Военная драма о летчицах в годы Великой Отечественной войны.',
            genre: 'Военный',
            durationMin: 150,
            posterUrl: 'https://example.com/vozduh.jpg',
            releaseDate: '2024-01-18'
        },
        {
            title: 'Повелитель ветра',
            description: 'Фильм о путешествии Федора Конюхова вокруг света на воздушном шаре.',
            genre: 'Приключения',
            durationMin: 135,
            posterUrl: 'https://example.com/povelitel.jpg',
            releaseDate: '2024-02-22'
        },
        {
            title: 'Лёд 3',
            description: 'Продолжение романтической истории о фигуристах, их любви и спортивных достижениях.',
            genre: 'Мелодрама',
            durationMin: 140,
            posterUrl: 'https://example.com/led3.jpg',
            releaseDate: '2024-02-14'
        },
        {
            title: 'Сто лет тому вперёд',
            description: 'Фантастическая история по мотивам повести Кира Булычева о приключениях Алисы Селезневой.',
            genre: 'Фантастика',
            durationMin: 140,
            posterUrl: 'https://example.com/stolet.jpg',
            releaseDate: '2024-04-18'
        }
    ];
    
    let added = 0;
    let existing = 0;
    
    for (const movie of movies) {
        const exists = await db.get('SELECT id FROM movies WHERE title = ?', [movie.title]);
        if (!exists) {
            await db.run(
                `INSERT INTO movies (title, description, genre, duration_min, poster_url, release_date)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [movie.title, movie.description, movie.genre, movie.durationMin, movie.posterUrl, movie.releaseDate]
            );
            console.log(`✓ Добавлен фильм: ${movie.title}`);
            added++;
        } else {
            console.log(`→ Фильм уже есть: ${movie.title}`);
            existing++;
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`✅ Готово! Добавлено фильмов: ${added}`);
    console.log(`📌 Уже существовало: ${existing}`);
    console.log(`🎬 Всего фильмов в базе: ${added + existing}`);
    console.log('='.repeat(50));
    
    // Покажем все фильмы
    const allMovies = await db.all('SELECT id, title, genre FROM movies ORDER BY release_date DESC');
    console.log('\n📋 Текущая афиша:');
    allMovies.forEach((movie, index) => {
        console.log(`${index + 1}. ${movie.title} (${movie.genre})`);
    });
    
    process.exit(0);
}

addRussianMovies().catch(error => {
    console.error('❌ Ошибка:', error);
    process.exit(1);
});