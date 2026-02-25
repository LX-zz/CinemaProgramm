const { initDatabase, getDb } = require('./src/config/database');
const Hall = require('./src/models/Hall');

async function addHalls() {
    const db = await initDatabase();
    
    console.log('Добавляем залы...');
    
    const halls = [
        { name: 'Зал 1 (Синий)', type: 'Стандарт', totalRows: 10, totalSeats: 160 },
        { name: 'Зал 2 (Красный)', type: 'VIP', totalRows: 8, totalSeats: 120 },
        { name: 'Зал 3 (Золотой)', type: 'IMAX', totalRows: 12, totalSeats: 192 }
    ];
    
    for (const hall of halls) {
        const exists = await db.get('SELECT id FROM halls WHERE name = ?', [hall.name]);
        if (!exists) {
            await Hall.create(hall);
            console.log(`✓ Добавлен зал: ${hall.name}`);
        } else {
            console.log(`→ Зал уже есть: ${hall.name}`);
        }
    }
    
    const allHalls = await db.all('SELECT * FROM halls');
    console.log('\n📋 Все залы:', allHalls);
    
    process.exit(0);
}

addHalls().catch(console.error);