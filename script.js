const API_KEY = "e76ad5a2adac40fcbe953121252810";

const searchBtn = document.getElementById("searchBtn");
const btnText = document.getElementById("btnText");
const loader = document.getElementById("loader");
const geoBtn = document.getElementById("geoBtn"); // Geolocation button
const locationInput = document.getElementById("locationInput");
const weatherInfo = document.getElementById("weatherInfo");
const errorMessage = document.getElementById("errorMessage");

const cityName = document.getElementById("cityName");
const temp = document.getElementById("temp");
const condition = document.getElementById("condition");
const icon = document.getElementById("icon");
const feelsLike = document.getElementById("feelsLike");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const uvIndex = document.getElementById("uvIndex");
const sunrise = document.getElementById("sunrise");
const sunset = document.getElementById("sunset");
const moonPhase = document.getElementById("moonPhase");
const airQuality = document.getElementById("airQuality");

let weatherChart; // Store chart instance

// Add elements to background
const bg = document.getElementById("background");
// Create rain/cloud layers
const rainLayer = document.createElement("div");
rainLayer.className = "rain";
bg.appendChild(rainLayer);

const cloudLayer = document.createElement("div");
cloudLayer.className = "cloud-bg";
bg.appendChild(cloudLayer);
// Add a second cloud for parallax/more density
const cloudLayer2 = document.createElement("div");
cloudLayer2.className = "cloud-bg";
cloudLayer2.style.top = "30%";
cloudLayer2.style.animationDuration = "35s";
bg.appendChild(cloudLayer2);

// Event Listeners
searchBtn.addEventListener("click", handleSearch);
locationInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSearch();
});

// Geolocation
geoBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    showLoading(true);
    hideError();
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // WeatherAPI supports "lat,lon" as query
        getWeather(`${latitude},${longitude}`);
      },
      (err) => {
        showLoading(false);
        showError("Access to location denied or unavailable.");
      }
    );
  } else {
    showError("Geolocation is not supported by your browser.");
  }
});

// Initialize with saved location or default
window.addEventListener("DOMContentLoaded", () => {
  const lastLocation = localStorage.getItem("lastLocation");
  if (lastLocation) {
    locationInput.value = lastLocation;
    handleSearch(); // Use handleSearch to reuse logic
  }
});

modeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  modeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});

async function handleSearch() {
  const location = locationInput.value.trim();
  if (!location) return;

  showLoading(true);
  hideError();
  weatherInfo.classList.add("hidden");

  try {
    await getWeather(location);
    // Save successful search (if it's a name, saving coordinates if came from geo might be weird but acceptable)
    // Actually, if it came from geo, the input might be empty if we didn't fill it.
    // Let's rely on what's passed to getWeather or update key after success.
    // Simple approach: save what's in input. If input is empty (geo), maybe we shouldn't save it as "lastLocation" textual.
    // But let's keep it simple: just save the input value if valid.
    if (location) localStorage.setItem("lastLocation", location);
  } catch (err) {
    showError(err.message);
  } finally {
    showLoading(false);
  }
}

const hourlyContainer = document.getElementById("hourlyForecast");
const dailyContainer = document.getElementById("dailyForecast");

// ... (EventListener code is fine, no change needed there)

async function getWeather(location) {
  // Use forecast.json endpoint (days=3)
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(location)}&days=3&aqi=yes`;
  const res = await fetch(url);

  if (!res.ok) throw new Error("Location not found. Please try again.");

  const data = await res.json();
  updateUI(data);
}

function updateUI(data) {
  // Main Info
  cityName.textContent = `${data.location.name}, ${data.location.country}`;
  temp.textContent = `${Math.round(data.current.temp_c)}°C`;
  condition.textContent = data.current.condition.text;
  icon.src = `https:${data.current.condition.icon}`;

  // Details Grid
  feelsLike.textContent = `${Math.round(data.current.feelslike_c)}°C`;
  humidity.textContent = `${data.current.humidity}%`;
  wind.textContent = `${data.current.wind_kph} km/h`;
  uvIndex.textContent = data.current.uv;

  // Astro Info
  sunrise.textContent = data.forecast.forecastday[0].astro.sunrise;
  sunset.textContent = data.forecast.forecastday[0].astro.sunset;
  moonPhase.textContent = data.forecast.forecastday[0].astro.moon_phase;

  // Air Quality
  const aqiVal = data.current.air_quality ? data.current.air_quality['us-epa-index'] : '--';
  airQuality.textContent = `Index: ${aqiVal}`;

  weatherInfo.classList.remove("hidden");
  updateBackground(data.current.condition.text.toLowerCase());

  // Render Forecasts & Chart
  const hours = data.forecast.forecastday[0].hour;
  const days = data.forecast.forecastday;

  renderHourly(hours);
  renderDaily(days);
  renderChart(hours);
}

function renderHourly(hours) {
  const hourlyContainer = document.getElementById("hourlyForecast");
  hourlyContainer.innerHTML = "";

  // Filter for next 24 hours
  const currentEpoch = new Date().getTime() / 1000;
  const futureHours = hours.filter(h => h.time_epoch >= currentEpoch - 3600);

  futureHours.forEach(hour => {
    const card = document.createElement("div");
    card.className = "hourly-card";

    // Parse time
    const timeStr = hour.time.split(" ")[1];

    card.innerHTML = `
      <span>${timeStr}</span>
      <img src="https:${hour.condition.icon}" alt="icon">
      <span>${Math.round(hour.temp_c)}°C</span>
    `;
    hourlyContainer.appendChild(card);
  });
}

function renderDaily(days) {
  const dailyContainer = document.getElementById("dailyForecast");
  dailyContainer.innerHTML = "";

  days.forEach(day => {
    const row = document.createElement("div");
    row.className = "daily-row";

    const date = new Date(day.date);
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });

    row.innerHTML = `
      <div class="daily-day">${dayName}</div>
      <div class="daily-icon">
        <img src="https:${day.day.condition.icon}" alt="icon">
      </div>
      <div class="daily-temp">
        ${Math.round(day.day.maxtemp_c)}° <span>/ ${Math.round(day.day.mintemp_c)}°</span>
      </div>
    `;
    dailyContainer.appendChild(row);
  });
}

function renderChart(hours) {
  const ctx = document.getElementById('tempChart').getContext('2d');

  // Filter for next 24 hours or just take 3-hour intervals to not crowd chart
  const currentEpoch = new Date().getTime() / 1000;
  const futureHours = hours.filter(h => h.time_epoch >= currentEpoch - 3600);

  // Prepare data
  const labels = futureHours.map(h => h.time.split(" ")[1]);
  const temps = futureHours.map(h => h.temp_c);

  if (weatherChart) {
    weatherChart.destroy();
  }

  weatherChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Temp (°C)',
        data: temps,
        borderColor: 'rgba(255, 255, 255, 0.9)',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
        }
      },
      scales: {
        x: {
          ticks: { color: 'rgba(255,255,255,0.7)', maxTicksLimit: 8 },
          grid: { display: false }
        },
        y: {
          ticks: { color: 'rgba(255,255,255,0.7)' },
          grid: { color: 'rgba(255,255,255,0.1)' }
        }
      }
    }
  });
}

function updateBackground(weatherText) {
  // Reset animations
  rainLayer.classList.remove("active");
  cloudLayer.classList.remove("active");
  cloudLayer2.classList.remove("active");

  if (weatherText.includes("rain") || weatherText.includes("drizzle")) {
    background.style.background = "linear-gradient(135deg, #4b6cb7, #182848)";
    avatarText.textContent = "Grab your umbrella ☔";
    rainLayer.classList.add("active");
  } else if (weatherText.includes("cloud") || weatherText.includes("overcast")) {
    background.style.background = "linear-gradient(135deg, #bdc3c7, #2c3e50)";
    avatarText.textContent = "Clouds look gloomy ☁️";
    cloudLayer.classList.add("active");
    cloudLayer2.classList.add("active");
  } else if (weatherText.includes("sun") || weatherText.includes("clear")) {
    background.style.background = "linear-gradient(135deg, #ff9966, #ff5e62)";
    avatarText.textContent = "Sunny and bright ☀️";
  } else if (weatherText.includes("snow") || weatherText.includes("ice")) {
    background.style.background = "linear-gradient(135deg, #e6dada, #274046)";
    avatarText.textContent = "Freezing out there ❄️";
  } else if (weatherText.includes("mist") || weatherText.includes("fog")) {
    background.style.background = "linear-gradient(135deg, #606c88, #3f4c6b)";
    avatarText.textContent = "Can't see much 🌫️";
    cloudLayer.classList.add("active"); // Fog can use cloud opacity
  } else {
    // Default
    background.style.background = "linear-gradient(135deg, #141e30, #243b55)";
    avatarText.textContent = "Enjoy the weather 🌍";
  }
}

function showLoading(isLoading) {
  if (isLoading) {
    btnText.classList.add("hidden");
    loader.classList.remove("hidden");
    searchBtn.disabled = true;
  } else {
    btnText.classList.remove("hidden");
    loader.classList.add("hidden");
    searchBtn.disabled = false;
  }
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
}

function hideError() {
  errorMessage.classList.add("hidden");
}
