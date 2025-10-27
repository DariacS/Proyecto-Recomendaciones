// frontend/app.js

// --- CONFIGURACIÓN ---
const OPENWEATHER_KEY = "d293c492a381fca5eee5d10e5f7abc14"; // ¡Su clave de OWM!
const API_BASE_URL = "http://127.0.0.1:8000/api/v1/recommendations/";

// --- ELEMENTOS DEL DOM ---
const locationNameEl = document.getElementById('location-name');
const errorContainerEl = document.getElementById('error-container');
const errorMessageEl = document.getElementById('error-message');
const loadingContainerEl = document.getElementById('loading-container');
const loadingMessageEl = document.getElementById('loading-message');
const mainContentEl = document.getElementById('main-content');
const weatherWidgetEl = document.getElementById('weather-widget');
const moviesContentEl = document.getElementById('movies-content');
const restaurantsContentEl = document.getElementById('restaurants-content');
const searchInput = document.getElementById('location-input');
const searchButton = document.getElementById('search-button');
const geoButton = document.getElementById('geo-button');

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', handleGeolocation);
searchButton.addEventListener('click', () => handleManualSearch());
geoButton.addEventListener('click', handleGeolocation);
searchInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') handleManualSearch();
});

// --- LÓGICA DE OBTENCIÓN DE DATOS ---

function handleGeolocation() {
    if (navigator.geolocation) {
        setLoading(true, "Buscando su ubicación...");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchRecommendations(latitude, longitude);
            },
            (error) => {
                console.error("Error de geolocalización:", error);
                showError("No se pudo obtener la ubicación. Busque manualmente.");
                handleManualSearch("Santiago");
            }
        );
    } else {
        showError("Geolocalización no soportada. Busque manualmente.");
        handleManualSearch("Santiago");
    }
}

async function handleManualSearch(defaultLocation = null) {
    const locationQuery = defaultLocation || searchInput.value;
    if (!locationQuery) {
        showError("Por favor, ingrese el nombre de una ciudad.");
        return;
    }
    setLoading(true, `Buscando "${locationQuery}"...`);
    const geocodingUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${locationQuery}&limit=1&appid=${OPENWEATHER_KEY}`;
    try {
        const response = await fetch(geocodingUrl);
        if (!response.ok) throw new Error('Error en API de Geocoding');
        const data = await response.json();
        if (data && data.length > 0) {
            const { lat, lon } = data[0];
            fetchRecommendations(lat, lon);
        } else {
            throw new Error(`No se encontró la ubicación: "${locationQuery}"`);
        }
    } catch (error) {
        console.error(error);
        showError(error.message);
        setLoading(false);
    }
}

async function fetchRecommendations(lat, lon) {
    const apiUrl = `${API_BASE_URL}?lat=${lat}&lon=${lon}`;
    searchInput.value = "";

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        const data = await response.json();

        // --- CAMBIO AQUÍ ---
        // Usamos la nueva 'precise_address' del backend
        locationNameEl.textContent = data.precise_address;
        // --- FIN DEL CAMBIO ---

        renderWeather(data.weather);
        renderMovies(data.movies_now_playing);
        renderRestaurants(data.nearby_restaurants);
        
        setLoading(false);

    } catch (error) {
        console.error('Error al cargar recomendaciones:', error);
        showError(`No se pudieron cargar los datos.`);
        setLoading(false);
    }
}

// --- FUNCIONES DE RENDERIZADO (Sin cambios) ---

function renderWeather(weather) {
    if (weather.error) {
        weatherWidgetEl.innerHTML = `<div class="card bg-danger text-white shadow"><div class="card-body">${weather.error}</div></div>`;
        return;
    }
    
    weatherWidgetEl.innerHTML = `
        <div class="card shadow border-0">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h5 class="card-title mb-0">${weather.temp}°C</h5>
                        <p class="card-text text-muted mb-0" style="text-transform: capitalize;">${weather.description}</p>
                    </div>
                    <img src="${weather.icon_url}" alt="${weather.description}" style="width: 75px; height: 75px;">
                </div>
                <small class="text-muted">Sensación: ${weather.feels_like}°C</small>
            </div>
        </div>
    `;
}

function renderMovies(movies) {
    if (movies.error || !movies.length) {
        moviesContentEl.innerHTML = `<p class="text-muted px-4">${movies.error || 'No se encontraron películas.'}</p>`;
        return;
    }

    let html = '';
    movies.forEach(movie => {
        const poster = movie.poster_url ? 
            `<img src="${movie.poster_url}" class="card-img-top movie-poster-img" alt="${movie.title}">` : 
            '<div class="card-img-top bg-secondary d-flex align-items-center justify-content-center" style="height: 200px;"><i class="bi bi-film fs-1 text-white-50"></i></div>';

        html += `
            <div class="card scroll-card shadow-sm">
                ${poster}
                <div class="card-body">
                    <h6 class="card-title text-truncate">${movie.title}</h6>
                    <small class="text-muted">Estreno: ${movie.release_date}</small>
                    <p class="card-text small mt-2">${movie.overview.substring(0, 100)}...</p>
                </div>
            </div>
        `;
    });
    moviesContentEl.innerHTML = html;
}

function renderRestaurants(restaurants) {
    if (restaurants.error || !restaurants.length) {
        restaurantsContentEl.innerHTML = `<p class="text-muted px-4">${restaurants.error || 'No se encontraron restaurantes.'}</p>`;
        return;
    }

    let html = '';
    restaurants.forEach(restaurant => {
        
        const photo = restaurant.photo_url ?
            `<img src="${restaurant.photo_url}" class="card-img-top restaurant-photo-img" alt="${restaurant.name}">` :
            `<div class="card-img-top bg-secondary d-flex align-items-center justify-content-center" style="height: 200px;">
                <i class="bi bi-building fs-1 text-white-50"></i>
             </div>`;

        html += `
            <div class="card scroll-card shadow-sm">
                ${photo}
                <div class="card-body">
                    <h6 class="card-title text-truncate">${restaurant.name}</h6>
                    <h6 class="card-subtitle mb-2 text-warning">${'★'.repeat(Math.round(restaurant.rating))} <small class="text-muted">(${restaurant.rating || 'N/A'})</small></h6>
                    <p class="card-text small mt-2">${restaurant.address}</p>
                </div>
            </div>
        `;
    });
    restaurantsContentEl.innerHTML = html;
}

// --- FUNCIONES DE UTILIDAD (Sin cambios) ---

function setLoading(isLoading, message = "Cargando...") {
    if (isLoading) {
        mainContentEl.classList.add('d-none');
        loadingContainerEl.classList.remove('d-none');
        loadingMessageEl.textContent = message;
        errorContainerEl.classList.add('d-none');
        searchButton.disabled = true;
        geoButton.disabled = true;
    } else {
        mainContentEl.classList.remove('d-none');
        loadingContainerEl.classList.add('d-none');
        searchButton.disabled = false;
        geoButton.disabled = false;
    }
}

function showError(message) {
    errorMessageEl.textContent = message;
    errorContainerEl.classList.remove('d-none');
    loadingContainerEl.classList.add('d-none');
}