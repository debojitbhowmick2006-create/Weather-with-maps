// ---------- Config ----------
const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const REVERSE_GEOCODE_URL = 'https://nominatim.openstreetmap.org/reverse';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

// WMO weather codes -> human-readable text
// https://open-meteo.com/en/docs (see "WMO Weather interpretation codes")
const WEATHER_CODES = {
  0: 'Clear sky', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Light showers', 81: 'Showers', 82: 'Violent showers',
  85: 'Light snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Severe thunderstorm',
};

function describeCode(code) {
  return WEATHER_CODES[code] || 'Unknown conditions';
}

// ---------- DOM ----------
const form = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const suggestionsBox = document.getElementById('suggestions');
const locateBtn = document.getElementById('locate-btn');
const results = document.getElementById('results');

// ---------- Results card state rendering ----------
function renderEmpty() {
  results.innerHTML = `
    <div class="state-empty">
      Search a city above, or pick a point on the map, to see the current weather.
    </div>`;
}

function renderLoading() {
  results.innerHTML = `
    <div class="state-loading">
      <span class="spinner" aria-hidden="true"></span>
      Loading weather…
    </div>`;
}

function renderError(message) {
  results.innerHTML = `
    <div class="state-error" role="alert">
      <div>
        <strong>Couldn't load the weather</strong>
        ${message}
      </div>
    </div>`;
}

function renderWeather(placeLabel, weather) {
  const { temperature, feelsLike, weatherCode, humidity, windSpeed, isDay } = weather;
  results.innerHTML = `
    <div class="state-weather">
      <p class="place">${placeLabel}</p>
      <div class="temp-row">
        <span class="temp">${Math.round(temperature)}°C</span>
        <span class="condition">${describeCode(weatherCode)}${isDay === 0 ? ' · night' : ''}</span>
      </div>
      <p class="feels-like">Feels like ${Math.round(feelsLike)}°C</p>
      <div class="detail-grid">
        <div>
          <span class="detail-label">Humidity</span>
          <span class="detail-value">${humidity}%</span>
        </div>
        <div>
          <span class="detail-label">Wind</span>
          <span class="detail-value">${Math.round(windSpeed)} km/h</span>
        </div>
        <div>
          <span class="detail-label">Coordinates</span>
          <span class="detail-value">${weather.lat.toFixed(2)}, ${weather.lon.toFixed(2)}</span>
        </div>
      </div>
      <div class="mini-map-container">
        <div id="mini-map"></div>
      </div>
      <a href="https://www.google.com/maps/search/?api=1&query=${weather.lat},${weather.lon}" target="_blank" class="map-link-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        Open in Google Maps
      </a>
    </div>`;

  // Initialize Leaflet Map
  const miniMap = L.map('mini-map', {
    zoomControl: false,
    attributionControl: false,
    scrollWheelZoom: false,
    dragging: false
  }).setView([weather.lat, weather.lon], 13);
  
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(miniMap);
  L.marker([weather.lat, weather.lon]).addTo(miniMap);
}

// ---------- Weather fetching (shared by search + map + geolocation) ----------
async function loadWeatherFor(lat, lon, placeLabel) {
  renderLoading();
  try {
    const url = new URL(FORECAST_URL);
    url.searchParams.set('latitude', lat);
    url.searchParams.set('longitude', lon);
    url.searchParams.set('current', 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day');
    url.searchParams.set('timezone', 'auto');

    const res = await fetch(url);
    if (!res.ok) throw new Error('forecast request failed');
    const data = await res.json();
    const c = data.current;

    renderWeather(placeLabel, {
      temperature: c.temperature_2m,
      feelsLike: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      windSpeed: c.wind_speed_10m,
      weatherCode: c.weather_code,
      isDay: c.is_day,
      lat, lon,
    });
  } catch (err) {
    renderError('The weather service didn\u2019t respond. Check your connection and try again.');
  }
}

// ---------- City search ----------
async function geocodeCity(name) {
  const url = new URL(GEOCODE_URL);
  url.searchParams.set('name', name);
  url.searchParams.set('count', '5');
  const res = await fetch(url);
  if (!res.ok) throw new Error('geocoding failed');
  const data = await res.json();
  return data.results || [];
}

function formatPlace(place) {
  const parts = [place.name, place.admin1, place.country].filter(Boolean);
  return parts.join(', ');
}

function selectPlace(place) {
  hideSuggestions();
  cityInput.value = place.name;
  loadWeatherFor(place.latitude, place.longitude, formatPlace(place));
  setMarker(place.latitude, place.longitude);
}

function hideSuggestions() {
  suggestionsBox.hidden = true;
  suggestionsBox.innerHTML = '';
}

function showSuggestions(list) {
  if (!list.length) { hideSuggestions(); return; }
  suggestionsBox.innerHTML = list.map((place, i) => `
    <button type="button" data-index="${i}">
      ${place.name}
      <span class="place-region">${[place.admin1, place.country].filter(Boolean).join(', ')}</span>
    </button>
  `).join('');
  suggestionsBox.hidden = false;

  suggestionsBox.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => selectPlace(list[Number(btn.dataset.index)]));
  });
}

let debounceTimer = null;
let lastResults = [];

cityInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  const query = cityInput.value.trim();
  if (query.length < 2) { hideSuggestions(); return; }
  debounceTimer = setTimeout(async () => {
    try {
      lastResults = await geocodeCity(query);
      showSuggestions(lastResults);
    } catch {
      hideSuggestions();
    }
  }, 350);
});

document.addEventListener('click', (e) => {
  if (!suggestionsBox.contains(e.target) && e.target !== cityInput) hideSuggestions();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = cityInput.value.trim();
  if (!query) return;
  hideSuggestions();
  renderLoading();
  try {
    const list = lastResults.length ? lastResults : await geocodeCity(query);
    if (!list.length) {
      renderError(`We couldn\u2019t find "${query}". Check the spelling or try a nearby larger city.`);
      return;
    }
    selectPlace(list[0]);
  } catch {
    renderError('The location search didn\u2019t respond. Check your connection and try again.');
  }
});

// ---------- Map ----------
let globe = null;

function initGlobe() {
  const mapEl = document.getElementById('map');
  
  globe = Globe()
    (mapEl)
    .width(mapEl.clientWidth)
    .height(mapEl.clientHeight)
    .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
    .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
    .backgroundColor('#050505')
    .showAtmosphere(true)
    .atmosphereColor('#0096ff')
    .atmosphereAltitude(0.15);

  // Set controls
  globe.controls().autoRotate = true;
  globe.controls().autoRotateSpeed = 0.5;

  // Handle globe click
  globe.onGlobeClick(async ({ lat, lng }) => {
    setMarker(lat, lng);
    renderLoading();
    const label = await reverseGeocode(lat, lng);
    loadWeatherFor(lat, lng, label);
  });

  // Handle resize
  window.addEventListener('resize', () => {
    globe.width(mapEl.clientWidth);
    globe.height(mapEl.clientHeight);
  });
}

initGlobe();

function setMarker(lat, lon) {
  globe.pointsData([{ lat, lng: lon }]);
  globe.pointAltitude(0.02)
       .pointRadius(0.8)
       .pointColor(() => '#00d2ff')
       .pointResolution(32);
       
  // Animate and zoom in much closer to the location (altitude 0.4)
  globe.pointOfView({ lat, lng: lon, altitude: 0.4 }, 2000);
}

async function reverseGeocode(lat, lon) {
  try {
    const url = new URL(REVERSE_GEOCODE_URL);
    url.searchParams.set('lat', lat);
    url.searchParams.set('lon', lon);
    url.searchParams.set('format', 'json');
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('reverse geocode failed');
    const data = await res.json();
    const a = data.address || {};
    const place = a.city || a.town || a.village || a.county || a.state;
    return place ? `${place}${a.country ? ', ' + a.country : ''}` : `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  } catch {
    return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  }
}

// ---------- Locate me ----------
locateBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    renderError('Your browser doesn\u2019t support location access. Try searching instead.');
    return;
  }
  renderLoading();
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      setMarker(latitude, longitude);
      const label = await reverseGeocode(latitude, longitude);
      loadWeatherFor(latitude, longitude, label);
    },
    () => {
      renderError('Location access was denied or unavailable. Try searching for a city instead.');
    },
    { timeout: 10000 }
  );
});

// ---------- Initial state ----------
renderEmpty();
