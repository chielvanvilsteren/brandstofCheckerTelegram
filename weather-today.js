// weather-today.js
import fetch from "node-fetch";

function formatDate(date) {
  return date.toISOString().split("T")[0]; // voor intern gebruik/API
}

function formatEuropeanDate(date) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  // Geeft: "5 april 2025"
}

function formatEuropeanDateWithWeekday(date) {
  return new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  // Geeft: "vrijdag 5 april 2025"
}

async function getWeatherForecast(targetDate) {
  const latitude = 52.2461; // Deventer
  const longitude = 6.1846;


  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,precipitation&timezone=Europe/Amsterdam`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const times = data.hourly.time;
    const temps = data.hourly.temperature_2m;
    const precipitation = data.hourly.precipitation;

    const periods = {
      morning: { start: "06:00", end: "12:00", temp: [], rain: [] },
      afternoon: { start: "12:00", end: "18:00", temp: [], rain: [] },
      evening: { start: "18:00", end: "24:00", temp: [], rain: [] },
    };

    for (let i = 0; i < times.length; i++) {
      const time = times[i];
      const temp = temps[i];
      const rain = precipitation[i];

      if (!time.startsWith(targetDate)) continue;

      const hour = time.split("T")[1];

      if (hour >= periods.morning.start && hour < periods.morning.end) {
        periods.morning.temp.push(temp);
        periods.morning.rain.push(rain);
      } else if (
        hour >= periods.afternoon.start &&
        hour < periods.afternoon.end
      ) {
        periods.afternoon.temp.push(temp);
        periods.afternoon.rain.push(rain);
      } else if (hour >= periods.evening.start && hour < periods.evening.end) {
        periods.evening.temp.push(temp);
        periods.evening.rain.push(rain);
      }
    }

    function avg(arr) {
      if (arr.length === 0) return 0;
      const average = arr.reduce((a, b) => a + b, 0) / arr.length;
      return Math.round(average * 10) / 10; // Afgerond op 1 decimaal
    }

    // Maak de datumobjecten
    const dateObject = new Date(targetDate); // Zet string om naar Date
    const datumUitgeschreven = formatEuropeanDate(dateObject); // "5 april 2025"
    const datumMetWeekdag = formatEuropeanDateWithWeekday(dateObject); // "vrijdag 5 april 2025"

    const result = {
      datum: targetDate, // blijft YYYY-MM-DD voor compatibiliteit
      datumUitgeschreven, // "5 april 2025"
      datumMetWeekdag, // "vrijdag 5 april 2025"
      ochtend: {
        temperatuur: avg(periods.morning.temp),
        regen: parseFloat(
          periods.morning.rain.reduce((a, b) => a + b, 0).toFixed(1)
        ),
      },
      middag: {
        temperatuur: avg(periods.afternoon.temp),
        regen: parseFloat(
          periods.afternoon.rain.reduce((a, b) => a + b, 0).toFixed(1)
        ),
      },
      avond: {
        temperatuur: avg(periods.evening.temp),
        regen: parseFloat(
          periods.evening.rain.reduce((a, b) => a + b, 0).toFixed(1)
        ),
      },
    };

    console.log(JSON.stringify(result)); // Belangrijk voor de checker
    return result;
  } catch (error) {
    console.error("Fout bij ophalen van de weersvoorspelling:", error.message);
    return null;
  }
}

// === Start het script ===
const today = formatDate(new Date());
console.log("\n🌤️ [WEER] Ophalen weersvoorspelling voor VANDAAG...");
getWeatherForecast(today);
