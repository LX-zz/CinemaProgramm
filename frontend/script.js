const API_URL = 'http://127.0.0.1:5001/api';
let currentUser = null;
let selectedSeats = new Set();
let currentSession = null;
let currentMovie = null;

// Проверка авторизации при загрузке
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Script started');
    console.log('API_URL:', API_URL);
    await checkAuth();
    await loadMovies();
    setupEventListeners();
});

// Проверка авторизации
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

// Обновление информации о пользователе
function updateUserInfo() {
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        userInfo.innerHTML = `
            <span class="user-name">${currentUser.name}</span>
            <button class="logout-btn" onclick="logout()">Выйти</button>
        `;
    }
}

// Выход
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Переключение вкладок
function showTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    if (tabName === 'bookings') loadUserBookings();
    if (tabName === 'profile') loadUserProfile();
}

// Загрузка фильмов из базы данных
async function loadMovies() {
    console.log('Loading movies...');
    try {
        const response = await fetch(`${API_URL}/movies`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const movies = await response.json();
        console.log('Movies received:', movies);
        
        const container = document.getElementById('moviesContainer');
        if (!container) {
            console.error('Movies container not found!');
            return;
        }
        
        if (movies.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center; grid-column: 1/-1;">Фильмов пока нет в базе данных.</p>';
            return;
        }
        
        container.innerHTML = '';
        movies.forEach(movie => {
            const card = createMovieCard(movie);
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading movies:', error);
        const container = document.getElementById('moviesContainer');
        if (container) {
            container.innerHTML = `<p style="color: #ff4081; text-align: center; grid-column: 1/-1;">Ошибка загрузки: ${error.message}. Проверьте подключение к бэкенду на порту 5001.</p>`;
        }
    }
}

// Создание карточки фильма
function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.onclick = () => selectMovie(movie);
    
    card.innerHTML = `
        <div class="movie-poster">🎬</div>
        <div class="movie-info">
            <div class="movie-title">${movie.title}</div>
            <div class="movie-genre">${movie.genre}</div>
            <div class="movie-description">${movie.description || 'Описание отсутствует'}</div>
            <div class="movie-duration">⏱️ ${movie.duration_min} мин</div>
        </div>
    `;
    
    return card;
}

// Выбор фильма
async function selectMovie(movie) {
    currentMovie = movie;
    
    try {
        const response = await fetch(`${API_URL}/sessions/movie/${movie.id}`);
        const sessions = await response.json();
        
        if (sessions.length === 0) {
            alert('Нет доступных сеансов для этого фильма');
            return;
        }
        
        showSessionModal(movie, sessions);
    } catch (error) {
        console.error('Error loading sessions:', error);
        alert('Ошибка загрузки сеансов');
    }
}

// Показать модальное окно с выбором сеанса
function showSessionModal(movie, sessions) {
    const modal = document.getElementById('seatModal');
    document.getElementById('selectedMovieTitle').textContent = movie.title;
    
    const sessionsHtml = sessions.map(session => {
        const startTime = new Date(session.start_time);
        const timeStr = startTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const dateStr = startTime.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
        
        return `
            <div class="session-card" onclick="selectSession(${session.id})">
                <div>
                    <div style="font-weight: bold; color: #ffd700;">${dateStr} | ${timeStr}</div>
                    <div style="color: #999;">Зал: ${session.hall_name}</div>
                </div>
                <div class="session-price">${session.base_price} ₽</div>
            </div>
        `;
    }).join('');
    
    document.getElementById('sessionInfo').innerHTML = `
        <div style="width: 100%; text-align: center; margin-bottom: 15px; color: #ffd700;">Выберите сеанс:</div>
        ${sessionsHtml}
    `;
    
    modal.style.display = 'flex';
}

// Выбор сеанса
async function selectSession(sessionId) {
    try {
        const response = await fetch(`${API_URL}/sessions/${sessionId}`);
        const session = await response.json();
        
        currentSession = session;
        
        await loadSeats(sessionId);
        
        const startTime = new Date(session.start_time);
        document.getElementById('sessionInfo').innerHTML = `
            <div class="session-info-item">Дата: <span>${startTime.toLocaleDateString('ru-RU')}</span></div>
            <div class="session-info-item">Время: <span>${startTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span></div>
            <div class="session-info-item">Зал: <span>${session.hall_name}</span></div>
            <div class="session-info-item">Цена: <span>${session.base_price} ₽</span></div>
        `;
    } catch (error) {
        console.error('Error loading session:', error);
    }
}

// Загрузка мест для сеанса
async function loadSeats(sessionId) {
    try {
        const response = await fetch(`${API_URL}/sessions/${sessionId}/seats`);
        const seats = await response.json();
        
        const seatsByRow = {};
        seats.forEach(seat => {
            if (!seatsByRow[seat.row_number]) {
                seatsByRow[seat.row_number] = [];
            }
            seatsByRow[seat.row_number].push(seat);
        });
        
        let seatMapHtml = '';
        for (let row = 1; row <= 10; row++) {
            const rowLetter = String.fromCharCode(64 + row);
            seatMapHtml += '<div class="row">';
            seatMapHtml += `<div class="row-label">${rowLetter}</div>`;
            
            for (let col = 1; col <= 16; col++) {
                const seat = seats.find(s => s.row_number === row && s.seat_number === col);
                const status = seat?.is_booked ? 'taken' : 'free';
                seatMapHtml += `
                    <div class="seat ${status}" 
                         data-row="${row}" 
                         data-col="${col}"
                         onclick="toggleSeat(this)">
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

// Выбор/отмена места
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

// Обновление информации о бронировании
function updateBookingInfo() {
    const count = selectedSeats.size;
    document.getElementById('selectedSeats').textContent = `Выбрано мест: ${count}`;
    
    if (currentSession) {
        const total = count * currentSession.base_price;
        document.getElementById('totalPrice').textContent = total;
    }
    
    document.getElementById('bookBtn').disabled = count === 0;
}

// Бронирование мест
async function bookSeats() {
    if (selectedSeats.size === 0 || !currentSession) return;
    
    const seatIds = Array.from(selectedSeats).map(seat => {
        const [row, col] = seat.split('-');
        return (parseInt(row) - 1) * 16 + parseInt(col);
    });
    
    try {
        const response = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                sessionId: currentSession.id,
                seatIds: seatIds
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert('✅ Бронирование успешно создано!');
            closeSeatModal();
            showTab('bookings');
            await loadUserBookings();
        } else {
            alert('❌ Ошибка: ' + result.error);
        }
    } catch (error) {
        console.error('Booking error:', error);
        alert('❌ Ошибка при бронировании');
    }
}

// Закрыть модальное окно
function closeSeatModal() {
    document.getElementById('seatModal').style.display = 'none';
}

// Загрузка бронирований пользователя
async function loadUserBookings() {
    try {
        const response = await fetch(`${API_URL}/bookings/my`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const bookings = await response.json();
        
        const container = document.getElementById('bookingsContainer');
        
        if (bookings.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center;">У вас пока нет бронирований</p>';
            return;
        }
        
        container.innerHTML = bookings.map(booking => {
            const sessionTime = new Date(booking.start_time);
            return `
                <div class="booking-card">
                    <div class="booking-header">
                        <span class="booking-movie">${booking.movie_title}</span>
                        <span class="booking-status">${booking.status === 'confirmed' ? '✅ Подтверждено' : '❌ Отменено'}</span>
                    </div>
                    <div class="booking-seats">
                        Места: ${booking.seats.map(s => `${s.row_number}${s.seat_number}`).join(', ')}
                    </div>
                    <div class="booking-footer">
                        <span>${sessionTime.toLocaleDateString()} ${sessionTime.toLocaleTimeString()}</span>
                        <span class="booking-price">${booking.total_price} ₽</span>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}

// Загрузка профиля пользователя
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const user = await response.json();
        
        document.getElementById('profileInfo').innerHTML = `
            <div class="profile-card">
                <div class="profile-field">
                    <span class="profile-label">Имя:</span>
                    <span class="profile-value">${user.name}</span>
                </div>
                <div class="profile-field">
                    <span class="profile-label">Email:</span>
                    <span class="profile-value">${user.email}</span>
                </div>
                <div class="profile-field">
                    <span class="profile-label">Телефон:</span>
                    <span class="profile-value">${user.phone || 'Не указан'}</span>
                </div>
                <div class="profile-field">
                    <span class="profile-label">Роль:</span>
                    <span class="profile-value">${user.role === 'admin' ? 'Администратор' : 'Пользователь'}</span>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function setupEventListeners() {
    window.onclick = function(event) {
        const modal = document.getElementById('seatModal');
        if (event.target === modal) {
            closeSeatModal();
        }
    };
}