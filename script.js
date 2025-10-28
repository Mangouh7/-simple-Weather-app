const API_KEY = "e76ad5a2adac40fcbe953121252810";

const searchBtn = document.getElementById("searchBtn");
const locationInput = document.getElementById("locationInput");
const weatherInfo = document.getElementById("weatherInfo");
const cityName = document.getElementById("cityName");
const temp = document.getElementById("temp");
const condition = document.getElementById("condition");
const icon = document.getElementById("icon");
const feelsLike = document.getElementById("feelsLike");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const background = document.getElementById("background");
const modeToggle = document.getElementById("modeToggle");
const avatarText = document.getElementById("avatarText");

searchBtn.addEventListener("click", () => {
  const location = locationInput.value.trim();
  if (location) getWeather(location);
});

modeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  modeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});

async function getWeather(location) {
  try {
    const url = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(location)}&aqi=yes`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Location not found");
    const data = await res.json();

    cityName.textContent = `${data.location.name}, ${data.location.country}`;
    temp.textContent = `🌡️ ${data.current.temp_c}°C`;
    condition.textContent = data.current.condition.text;
    icon.src = `https:${data.current.condition.icon}`;
    feelsLike.textContent = `Feels like: ${data.current.feelslike_c}°C`;
    humidity.textContent = `Humidity: ${data.current.humidity}%`;
    wind.textContent = `Wind: ${data.current.wind_kph} km/h`;
    weatherInfo.classList.remove("hidden");

    // Change UI background
    const weatherText = data.current.condition.text.toLowerCase();
    if (weatherText.includes("rain")) {
      background.style.background = "linear-gradient(135deg,#3a7bd5,#3a6073)";
      avatarText.textContent = "Grab your umbrella ☔";
    } else if (weatherText.includes("cloud")) {
      background.style.background = "linear-gradient(135deg,#bdc3c7,#2c3e50)";
      avatarText.textContent = "Clouds are rolling in ☁️";
    } else if (weatherText.includes("sun") || weatherText.includes("clear")) {
      background.style.background = "linear-gradient(135deg,#f6d365,#fda085)";
      avatarText.textContent = "Nice sunny day 😎";
    } else if (weatherText.includes("snow")) {
      background.style.background = "linear-gradient(135deg,#83a4d4,#b6fbff)";
      avatarText.textContent = "It's cold innit 🥶";
    } else {
      background.style.background = "linear-gradient(135deg,#0f2027,#203a43,#2c5364)";
      avatarText.textContent = "Looks calm and quiet 🌌";
    }
  } catch (err) {
    alert("Could not fetch weather!");
  }
}
