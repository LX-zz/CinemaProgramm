const API_URL = 'http://localhost:5001/api';
const PRICE_PER_SEAT = 500;

let currentUser = null;
let selectedSeats = new Set();
let currentMovie = null;
let currentHall = { id: 1, name: 'Зал 1', rows: 8, cols: 12, price: 500 };
let userBookings = [];

// Предпочтения пользователя
let userPreferences = {
    seatPreference: 'center',
    specialNeeds: false
};

// База постеров фильмов
const moviePosters = {
    'Сто лет тому вперёд': 'https://avatars.mds.yandex.net/get-kinopoisk-image/4774061/3e3b5b5a-3b5b-4b5b-8b5b-5b5b5b5b5b5b/1920x',
    'Повелитель ветра': 'https://avatars.mds.yandex.net/get-kinopoisk-image/4774061/4f4f4f4f-4f4f-4f4f-8f4f-4f4f4f4f4f4f/1920x',
    'Горничная': 'https://avatars.mds.yandex.net/get-kinopoisk-image/4774061/5a5a5a5a-5a5a-5a5a-8a5a-5a5a5a5a5a5a/1920x',
    'Лёд 3': 'https://avatars.mds.yandex.net/get-kinopoisk-image/4774061/6b6b6b6b-6b6b-6b6b-8b6b-6b6b6b6b6b6b/1920x',
    'Мастер и Маргарита': 'https://avatars.mds.yandex.net/get-kinopoisk-image/4774061/7c7c7c7c-7c7c-7c7c-8c7c-7c7c7c7c7c7c/1920x',
    'Воздух': 'https://avatars.mds.yandex.net/get-kinopoisk-image/4774061/8d8d8d8d-8d8d-8d8d-8d8d-8d8d8d8d8d8d/1920x',
    'Бременские музыканты': 'https://avatars.mds.yandex.net/get-kinopoisk-image/4774061/9e9e9e9e-9e9e-9e9e-8e9e-9e9e9e9e9e9e/1920x',
    'Холоп 2': 'https://avatars.mds.yandex.net/get-kinopoisk-image/4774061/0f0f0f0f-0f0f-0f0f-8f0f-0f0f0f0f0f0f/1920x'
};

// Запасные постеры
const fallbackPosters = [
    'https://via.placeholder.com/300x450/1a1a1a/ffd700?text=+Сто+лет+тому+вперёд',
    'https://via.placeholder.com/300x450/1a1a1a/ff4081?text=+Повелитель+ветра',
    'https://via.placeholder.com/300x450/1a1a1a/4caf50?text=+Горничная',
    'https://via.placeholder.com/300x450/1a1a1a/2196f3?text=+Лёд+3',
    'https://via.placeholder.com/300x450/1a1a1a/ff9800?text=+Мастер+и+Маргарита',
    'https://via.placeholder.com/300x450/1a1a1a/9c27b0?text=+Воздух',
    'https://via.placeholder.com/300x450/1a1a1a/ff5722?text=+Бременские+музыканты',
    'https://via.placeholder.com/300x450/1a1a1a/795548?text=+Холоп+2'
];

function getMoviePoster(movieTitle, index) {
    return moviePosters[movieTitle] || fallbackPosters[index % fallbackPosters.length];
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Script started');
    await checkAuth();
    await loadMovies();
    loadUserPreferences();
    loadUserBookingsFromStorage();
    setupEventListeners();
});

function loadUserPreferences() {
    const saved = localStorage.getItem('userPreferences');
    if (saved) {
        userPreferences = JSON.parse(saved);
        console.log('Загружены предпочтения:', userPreferences);
    }
}

function saveUserPreferences() {
    localStorage.setItem('userPreferences', JSON.stringify(userPreferences));
    console.log('Сохранены предпочтения:', userPreferences);
}

// Загрузка бронирований из localStorage
function loadUserBookingsFromStorage() {
    const saved = localStorage.getItem('userBookings');
    if (saved) {
        userBookings = JSON.parse(saved);
        console.log('Загружены бронирования:', userBookings);
    }
}

// Сохранение бронирований в localStorage
function saveUserBookings() {
    localStorage.setItem('userBookings', JSON.stringify(userBookings));
}

async function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        currentUser = JSON.parse(user);
        updateUserInfo();
        await loadUserProfile();
        // Загружаем бронирования при проверке авторизации
        if (document.getElementById('bookingsTab').classList.contains('active')) {
            displayUserBookings();
        }
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
    // Не удаляем бронирования при выходе
    window.location.href = 'login.html';
}

function showTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    const tabBtn = document.querySelector(`[onclick="showTab('${tabName}')"]`);
    if (tabBtn) tabBtn.classList.add('active');
    
    const tabContent = document.getElementById(`${tabName}Tab`);
    if (tabContent) tabContent.classList.add('active');
    
    // Загружаем соответствующий контент
    if (tabName === 'bookings') {
        displayUserBookings();
    }
    if (tabName === 'profile') {
        loadUserProfile();
    }
}

async function loadMovies() {
    try {
        const response = await fetch(`${API_URL}/movies`);
        const movies = await response.json();
        
        const container = document.getElementById('moviesContainer');
        container.innerHTML = '';
        
        movies.forEach((movie, index) => {
            const card = createMovieCard(movie, index);
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading movies:', error);
    }
}

function createMovieCard(movie, index) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.onclick = () => selectMovie(movie);
    
    const posterUrl = getMoviePoster(movie.title, index);
    const encodedTitle = encodeURIComponent(movie.title);
    
    card.innerHTML = `
        <div class="movie-poster">
            <img src="${posterUrl}" 
                 alt="${movie.title}" 
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/300x450/1a1a1a/ffd700?text=${encodedTitle}'"
                 style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <div class="movie-info">
            <div class="movie-title">${movie.title}</div>
            <div class="movie-genre">${movie.genre}</div>
            <div class="movie-description">${movie.description || 'Описание отсутствует'}</div>
            <div class="movie-duration"> ${movie.duration_min} мин</div>
            <div class="movie-price">💰 ${PRICE_PER_SEAT} ₽/место</div>
        </div>
    `;
    
    return card;
}

function selectMovie(movie) {
    currentMovie = movie;
    document.getElementById('selectedMovieTitle').textContent = movie.title;
    showPreferencesModal();
}

function showPreferencesModal() {
    const modal = document.getElementById('preferencesModal');
    if (modal) {
        document.getElementById('seatPreference').value = userPreferences.seatPreference;
        document.getElementById('specialNeeds').checked = userPreferences.specialNeeds;
        modal.style.display = 'flex';
    }
}

function closePreferencesModal() {
    const modal = document.getElementById('preferencesModal');
    if (modal) modal.style.display = 'none';
}

function applyPreferences() {
    userPreferences.seatPreference = document.getElementById('seatPreference').value;
    userPreferences.specialNeeds = document.getElementById('specialNeeds').checked;
    saveUserPreferences();
    
    closePreferencesModal();
    loadHallWithPreferences();
}

function loadHallWithPreferences() {
    document.getElementById('hallInfo').innerHTML = `
        <div style="text-align: center; padding: 15px; background: #222; border-radius: 10px; margin-bottom: 20px;">
            <h3 style="color: #ffd700; margin-bottom: 10px;">${currentHall.name}</h3>
            <p style="color: #fff;">Цена билета: ${currentHall.price} ₽</p>
            <p style="color: #ffd700; margin-top: 10px; padding: 10px; background: #333; border-radius: 8px;">
                🔍 ${getPreferenceDescription()}
            </p>
        </div>
    `;
    
    loadSeats(1);
    document.getElementById('seatModal').style.display = 'flex';
}

function getPreferenceDescription() {
    if (userPreferences.specialNeeds) {
        return '♿ Специальные места (первые ряды, места 1-3)';
    }
    
    switch(userPreferences.seatPreference) {
        case 'front': 
            return 'Ближе к экрану: ряды 1-2';
        case 'center': 
            return 'Центр зала: ряды 4-5';
        case 'back': 
            return 'Подальше от экрана: ряды 7-8';
        case 'aisle': 
            return 'У прохода: крайние места (колонки 1 и 12)';
        default: 
            return 'Все места доступны';
    }
}

async function loadSeats(hallId) {
    try {
        let seatMapHtml = '';
        
        // Определяем рекомендуемые ряды и места
        let recommendedRows = [];
        let recommendedCols = [];
        
        if (userPreferences.specialNeeds) {
            recommendedRows = [1, 2];
            recommendedCols = [1, 2, 3];
        } else {
            switch(userPreferences.seatPreference) {
                case 'front': 
                    recommendedRows = [1, 2];
                    recommendedCols = [1,2,3,4,5,6,7,8,9,10,11,12];
                    break;
                case 'center': 
                    recommendedRows = [4, 5];
                    recommendedCols = [1,2,3,4,5,6,7,8,9,10,11,12];
                    break;
                case 'back': 
                    recommendedRows = [7, 8];
                    recommendedCols = [1,2,3,4,5,6,7,8,9,10,11,12];
                    break;
                case 'aisle': 
                    recommendedRows = [1,2,3,4,5,6,7,8];
                    recommendedCols = [1, 12];
                    break;
                default:
                    recommendedRows = [1,2,3,4,5,6,7,8];
                    recommendedCols = [1,2,3,4,5,6,7,8,9,10,11,12];
            }
        }
        
        for (let row = 1; row <= currentHall.rows; row++) {
            const rowLetter = String.fromCharCode(64 + row);
            seatMapHtml += '<div class="row">';
            seatMapHtml += `<div class="row-label">${rowLetter}</div>`;
            
            for (let col = 1; col <= currentHall.cols; col++) {
                // 20% мест занято случайным образом
                const isTaken = Math.random() < 0.2;
                
                let isRecommended = false;
                if (recommendedRows.includes(row) && recommendedCols.includes(col)) {
                    isRecommended = true;
                }
                
                let status = 'free';
                if (isTaken) {
                    status = 'taken';
                } else if (isRecommended) {
                    status = 'recommended';
                }
                
                seatMapHtml += `
                    <div class="seat ${status}" 
                         data-row="${row}" 
                         data-col="${col}"
                         data-recommended="${isRecommended}"
                         onclick="toggleSeat(this)"
                         title="${isRecommended ? '✨ Рекомендуемое место' : ''}">
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
    
    const row = seatElement.dataset.row;
    const col = seatElement.dataset.col;
    const seatId = `${row}-${col}`;
    
    if (selectedSeats.has(seatId)) {
        selectedSeats.delete(seatId);
        seatElement.classList.remove('selected');
    } else {
        selectedSeats.add(seatId);
        seatElement.classList.add('selected');
        
        const rowLetter = String.fromCharCode(64 + parseInt(row));
        console.log(`Выбрано место: ${rowLetter}${col}`);
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

function bookSeats() {
    if (selectedSeats.size === 0 || !currentUser) return;
    
    const seatsList = Array.from(selectedSeats).map(seat => {
        const [row, col] = seat.split('-');
        return `${String.fromCharCode(64 + parseInt(row))}${col}`;
    }).join(', ');
    
    // Создаем новое бронирование
    const newBooking = {
        id: Date.now(),
        movieTitle: currentMovie.title,
        hallName: currentHall.name,
        seats: seatsList,
        seatsCount: selectedSeats.size,
        totalPrice: selectedSeats.size * PRICE_PER_SEAT,
        date: new Date().toLocaleDateString('ru-RU'),
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        status: 'confirmed'
    };
    
    // Добавляем в массив бронирований
    userBookings.push(newBooking);
    saveUserBookings();
    
    alert(`Бронирование успешно создано!\n\n🎬 Фильм: ${currentMovie.title}\n🎫 Зал: ${currentHall.name}\n💺 Места: ${seatsList}\n💰 Сумма: ${selectedSeats.size * PRICE_PER_SEAT} ₽`);
    
    selectedSeats.clear();
    updateBookingInfo();
    closeSeatModal();
    
    // Если мы на вкладке бронирований, обновляем отображение
    if (document.getElementById('bookingsTab').classList.contains('active')) {
        displayUserBookings();
    }
}

function closeSeatModal() {
    document.getElementById('seatModal').style.display = 'none';
}

// Отображение бронирований пользователя
function displayUserBookings() {
    const container = document.getElementById('bookingsContainer');
    
    if (!container) return;
    
    if (userBookings.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #999; padding: 40px;">У вас пока нет бронирований</div>';
        return;
    }
    
    let html = '';
    userBookings.forEach(booking => {
        html += `
            <div class="booking-card">
                <div class="booking-header">
                    <span class="booking-movie">${booking.movieTitle}</span>
                    <span class="booking-status" style="color: #4caf50;">✅ Подтверждено</span>
                </div>
                <div class="booking-seats">
                    Места: ${booking.seats}
                </div>
                <div class="booking-footer">
                    <span>📅 ${booking.date} ${booking.time}</span>
                    <span>🎫 ${booking.seatsCount} мест</span>
                    <span class="booking-price">${booking.totalPrice} ₽</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Загрузка профиля пользователя
async function loadUserProfile() {
    if (!currentUser) return;
    
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
    
    const profileInfo = document.getElementById('profileInfo');
    if (profileInfo) {
        profileInfo.innerHTML = `
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
                <div class="profile-field">
                    <span class="profile-label">Всего бронирований:</span>
                    <span class="profile-value">${userBookings.length}</span>
                </div>
                <button onclick="showPreferencesModal()" style="margin-top: 20px; padding: 10px; background: #ff4081; color: white; border: none; border-radius: 8px; cursor: pointer; width: 100%;">
                    Изменить предпочтения
                </button>
            </div>
        `;
    }
}

function setupEventListeners() {
    window.onclick = function(event) {
        const seatModal = document.getElementById('seatModal');
        if (event.target === seatModal) {
            closeSeatModal();
        }
        
        const prefModal = document.getElementById('preferencesModal');
        if (event.target === prefModal) {
            prefModal.style.display = 'none';
        }
    };
}