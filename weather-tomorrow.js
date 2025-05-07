// weather-tomorrow.js
import fetch from "node-fetch";

function formatDate(date) {
  return date.toISOString().split("T")[0]; // blijft YYYY-MM-DD voor API-doelen
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
      return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    return {
      datum: targetDate,
      ochtend: {
        temperatuur:
          periods.morning.temp.length > 0 ? avg(periods.morning.temp) : null,
        regen: periods.morning.rain.reduce((a, b) => a + b, 0),
      },
      middag: {
        temperatuur:
          periods.afternoon.temp.length > 0
            ? avg(periods.afternoon.temp)
            : null,
        regen: periods.afternoon.rain.reduce((a, b) => a + b, 0),
      },
      avond: {
        temperatuur:
          periods.evening.temp.length > 0 ? avg(periods.evening.temp) : null,
        regen: periods.evening.rain.reduce((a, b) => a + b, 0),
      },
    };
  } catch (error) {
    console.error("Fout bij ophalen van de weersvoorspelling:", error.message);
    throw error;
  }
}

export {
  getWeatherForecast,
  formatDate,
  formatEuropeanDate,
  formatEuropeanDateWithWeekday,
};
