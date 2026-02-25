const API_URL = 'http://localhost:5001/api';
const PRICE_PER_SEAT = 500;

let currentUser = null;
let selectedSeats = new Set();
let currentMovie = null;
let currentHall = { id: 1, name: 'Зал 1', rows: 8, cols: 12, price: 500 };

// Предпочтения пользователя
let userPreferences = {
    seatPreference: 'center', // 'front', 'center', 'back', 'aisle'
    specialNeeds: false       // для слабовидящих
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Script started');
    await checkAuth();
    await loadMovies();
    loadUserPreferences();
    setupEventListeners();
});

// Загрузка предпочтений пользователя
function loadUserPreferences() {
    const saved = localStorage.getItem('userPreferences');
    if (saved) {
        userPreferences = JSON.parse(saved);
    }
}

// Сохранение предпочтений
function saveUserPreferences() {
    localStorage.setItem('userPreferences', JSON.stringify(userPreferences));
}

async function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        currentUser = JSON.parse(user);
        updateUserInfo();
        await loadUserBookings();
        await loadUserProfile();
    } else {
        window.location.href = 'login.html';
    }
}

function updateUserInfo() {
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        userInfo.innerHTML = `
            <span class="user-name">${currentUser.name}</span>
            <button class="logout-btn" onclick="logout()">Выйти</button>
        `;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

function showTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    if (tabName === 'bookings') loadUserBookings();
    if (tabName === 'profile') loadUserProfile();
}

async function loadMovies() {
    try {
        const response = await fetch(`${API_URL}/movies`);
        const movies = await response.json();
        
        const container = document.getElementById('moviesContainer');
        container.innerHTML = '';
        
        movies.forEach(movie => {
            const card = createMovieCard(movie);
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading movies:', error);
    }
}

function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.onclick = () => selectMovie(movie);
    
    card.innerHTML = `
        <div class="movie-poster">🎬</div>
        <div class="movie-info">
            <div class="movie-title">${movie.title}</div>
            <div class="movie-genre">${movie.genre}</div>
            <div class="movie-description">${movie.description || ''}</div>
            <div class="movie-duration">⏱️ ${movie.duration_min} мин</div>
            <div class="movie-price">💰 ${PRICE_PER_SEAT} ₽/место</div>
        </div>
    `;
    
    return card;
}

async function selectMovie(movie) {
    currentMovie = movie;
    document.getElementById('selectedMovieTitle').textContent = movie.title;
    
    // Показываем окно выбора предпочтений перед залом
    showPreferencesModal();
}

// Показать модальное окно с предпочтениями
function showPreferencesModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'preferencesModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <h2 style="color: #ffd700; margin-bottom: 20px;">Ваши предпочтения</h2>
            
            <div style="margin-bottom: 25px;">
                <label style="color: #ffd700; display: block; margin-bottom: 10px;">Предпочитаемое место:</label>
                <select id="seatPreference" style="width: 100%; padding: 12px; background: #333; color: #fff; border: 2px solid #444; border-radius: 8px;">
                    <option value="front" ${userPreferences.seatPreference === 'front' ? 'selected' : ''}>Ближе к экрану (первые ряды)</option>
                    <option value="center" ${userPreferences.seatPreference === 'center' ? 'selected' : ''}>Центр зала (ряды 4-5)</option>
                    <option value="back" ${userPreferences.seatPreference === 'back' ? 'selected' : ''}>Подальше от экрана (последние ряды)</option>
                    <option value="aisle" ${userPreferences.seatPreference === 'aisle' ? 'selected' : ''}>У прохода (крайние места)</option>
                </select>
            </div>
            
            <div style="margin-bottom: 25px;">
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                    <input type="checkbox" id="specialNeeds" ${userPreferences.specialNeeds ? 'checked' : ''} style="width: 20px; height: 20px;">
                    <span style="color: #fff;">Специальные места (для слабовидящих/с ограничениями) - первые ряды, ближе к выходу</span>
                </label>
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button onclick="closePreferencesModal()" style="flex: 1; padding: 15px; background: #333; color: #fff; border: none; border-radius: 8px; cursor: pointer;">Отмена</button>
                <button onclick="applyPreferences()" style="flex: 1; padding: 15px; background: #ff4081; color: #fff; border: none; border-radius: 8px; cursor: pointer;">Применить и выбрать места</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closePreferencesModal() {
    const modal = document.getElementById('preferencesModal');
    if (modal) modal.remove();
    closeSeatModal();
}

function applyPreferences() {
    // Сохраняем предпочтения
    userPreferences.seatPreference = document.getElementById('seatPreference').value;
    userPreferences.specialNeeds = document.getElementById('specialNeeds').checked;
    saveUserPreferences();
    
    // Закрываем окно предпочтений
    closePreferencesModal();
    
    // Загружаем зал с учетом предпочтений
    loadHallWithPreferences();
}

function loadHallWithPreferences() {
    document.getElementById('hallInfo').innerHTML = `
        <div style="text-align: center; padding: 10px; background: #222; border-radius: 10px;">
            <h3 style="color: #ffd700;">${currentHall.name}</h3>
            <p style="color: #fff;">Цена билета: ${currentHall.price} ₽</p>
            <p style="color: #ffd700; margin-top: 10px;">
                🔍 Рекомендация: ${getPreferenceDescription()}
            </p>
        </div>
    `;
    
    loadSeats(1);
    document.getElementById('seatModal').style.display = 'flex';
}

function getPreferenceDescription() {
    if (userPreferences.specialNeeds) {
        return 'Показаны специальные места (первые ряды, у проходов)';
    }
    
    switch(userPreferences.seatPreference) {
        case 'front': return 'Рекомендуем ряды 1-2 (ближе к экрану)';
        case 'center': return 'Рекомендуем ряды 4-5 (центр зала)';
        case 'back': return 'Рекомендуем ряды 7-8 (подальше от экрана)';
        case 'aisle': return 'Рекомендуем крайние места у проходов';
        default: return 'Все места доступны';
    }
}

async function loadSeats(hallId) {
    try {
        let seatMapHtml = '';
        
        // Определяем рекомендуемые ряды
        let recommendedRows = [];
        if (userPreferences.specialNeeds) {
            recommendedRows = [1, 2]; // Для слабовидящих - первые ряды
        } else {
            switch(userPreferences.seatPreference) {
                case 'front': recommendedRows = [1, 2]; break;
                case 'center': recommendedRows = [4, 5]; break;
                case 'back': recommendedRows = [7, 8]; break;
                case 'aisle': recommendedRows = [1,2,3,4,5,6,7,8]; break; // все ряды, но места у края
                default: recommendedRows = [1,2,3,4,5,6,7,8];
            }
        }
        
        for (let row = 1; row <= currentHall.rows; row++) {
            const rowLetter = String.fromCharCode(64 + row);
            seatMapHtml += '<div class="row">';
            seatMapHtml += `<div class="row-label">${rowLetter}</div>`;
            
            for (let col = 1; col <= currentHall.cols; col++) {
                const isTaken = Math.random() < 0.2;
                
                // Определяем, рекомендуется ли это место
                let isRecommended = false;
                if (userPreferences.specialNeeds) {
                    isRecommended = recommendedRows.includes(row) && col <= 3; // первые места у прохода
                } else if (userPreferences.seatPreference === 'aisle') {
                    isRecommended = col === 1 || col === currentHall.cols; // крайние места
                } else {
                    isRecommended = recommendedRows.includes(row);
                }
                
                let status = isTaken ? 'taken' : 'free';
                if (isRecommended && !isTaken) {
                    status = 'recommended';
                }
                
                seatMapHtml += `
                    <div class="seat ${status}" 
                         data-row="${row}" 
                         data-col="${col}"
                         data-recommended="${isRecommended}"
                         onclick="toggleSeat(this)"
                         title="${isRecommended ? '✅ Рекомендуемое место' : ''}">
                        ${rowLetter}${col}
                    </div>
                `;
            }
            seatMapHtml += '</div>';
        }
        
        document.getElementById('seatMap').innerHTML = seatMapHtml;
        selectedSeats.clear();
        updateBookingInfo();
        
    } catch (error) {
        console.error('Error loading seats:', error);
    }
}

function toggleSeat(seatElement) {
    if (seatElement.classList.contains('taken')) return;
    
    const seatId = `${seatElement.dataset.row}-${seatElement.dataset.col}`;
    
    if (selectedSeats.has(seatId)) {
        selectedSeats.delete(seatId);
        seatElement.classList.remove('selected');
    } else {
        selectedSeats.add(seatId);
        seatElement.classList.add('selected');
    }
    
    updateBookingInfo();
}

function updateBookingInfo() {
    const count = selectedSeats.size;
    document.getElementById('selectedSeats').textContent = `Выбрано мест: ${count}`;
    
    const total = count * PRICE_PER_SEAT;
    document.getElementById('totalPrice').textContent = total;
    
    document.getElementById('bookBtn').disabled = count === 0;
}

async function bookSeats() {
    if (selectedSeats.size === 0 || !currentUser) return;
    
    const seatsList = Array.from(selectedSeats).map(seat => {
        const [row, col] = seat.split('-');
        return `${String.fromCharCode(64 + parseInt(row))}${col}`;
    }).join(', ');
    
    // Проверяем, были ли выбраны рекомендуемые места
    const recommendedSelected = Array.from(selectedSeats).filter(seat => {
        const seatElement = document.querySelector(`[data-row="${seat.split('-')[0]}"][data-col="${seat.split('-')[1]}"]`);
        return seatElement && seatElement.dataset.recommended === 'true';
    }).length;
    
    let message = `✅ Бронирование успешно создано!\n\n`;
    message += `Фильм: ${currentMovie.title}\n`;
    message += `Зал: ${currentHall.name}\n`;
    message += `Места: ${seatsList}\n`;
    message += `Сумма: ${selectedSeats.size * PRICE_PER_SEAT} ₽\n`;
    
    if (recommendedSelected > 0) {
        message += `\n✨ Вы выбрали ${recommendedSelected} рекомендованных мест!`;
    }
    
    alert(message);
    
    // Очищаем выбранные места
    selectedSeats.clear();
    updateBookingInfo();
    closeSeatModal();
}

function closeSeatModal() {
    document.getElementById('seatModal').style.display = 'none';
}

async function loadUserBookings() {
    document.getElementById('bookingsContainer').innerHTML = '<p style="color: #999; text-align: center;">У вас пока нет бронирований</p>';
}

async function loadUserProfile() {
    if (!currentUser) return;
    
    // Получаем описание предпочтений
    let prefText = '';
    if (userPreferences.specialNeeds) {
        prefText = 'Специальные места';
    } else {
        switch(userPreferences.seatPreference) {
            case 'front': prefText = 'Ближе к экрану'; break;
            case 'center': prefText = 'Центр зала'; break;
            case 'back': prefText = 'Подальше от экрана'; break;
            case 'aisle': prefText = 'У прохода'; break;
            default: prefText = 'Не выбрано';
        }
    }
    
    document.getElementById('profileInfo').innerHTML = `
        <div class="profile-card">
            <div class="profile-field">
                <span class="profile-label">Имя:</span>
                <span class="profile-value">${currentUser.name}</span>
            </div>
            <div class="profile-field">
                <span class="profile-label">Email:</span>
                <span class="profile-value">${currentUser.email}</span>
            </div>
            <div class="profile-field">
                <span class="profile-label">Телефон:</span>
                <span class="profile-value">${currentUser.phone || 'Не указан'}</span>
            </div>
            <div class="profile-field">
                <span class="profile-label">Предпочтения:</span>
                <span class="profile-value">${prefText}</span>
            </div>
            <button onclick="showPreferencesModal()" style="margin-top: 20px; padding: 10px; background: #ff4081; color: white; border: none; border-radius: 8px; cursor: pointer; width: 100%;">
                Изменить предпочтения
            </button>
        </div>
    `;
}

function setupEventListeners() {
    window.onclick = function(event) {
        const modal = document.getElementById('seatModal');
        if (event.target === modal) {
            closeSeatModal();
        }
        
        const prefModal = document.getElementById('preferencesModal');
        if (event.target === prefModal) {
            prefModal.remove();
        }
    };
}