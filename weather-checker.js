// weather-checker.js

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

// Telegram bot initialiseren
const bot = new TelegramBot(process.env.TELEGRAM_WEATHER_BOT_TOKEN, {
  polling: false,
});

// Pad naar templatebestand
const TEMPLATE_PATH = path.resolve(
  __dirname,
  "telegram-templates",
  "weather.txt"
);

// Non-breaking space (goed voor mobiel)
const nbsp = "\u00A0";

// Formatteer weerbericht voor Telegram
function formatWeather(data) {
  return `
🌞 <b>Goedemorgen!</b>

🌤️ <b>Weersvoorspelling voor vandaag</b> (${data.datumMetWeekdag})

🌅 <b>Ochtend (06:00 – 12:00)</b>
🌡️ Gemiddelde temperatuur:${nbsp}${data.ochtend.temperatuur.toFixed(1)}°C
💧 Regen:${nbsp}${data.ochtend.regen.toFixed(1)} mm

🌇 <b>Middag (12:00 – 18:00)</b>
🌡️ Gemiddelde temperatuur:${nbsp}${data.middag.temperatuur.toFixed(1)}°C
💧 Regen:${nbsp}${data.middag.regen.toFixed(1)} mm

🌃 <b>Avond (18:00 – 24:00)</b>
🌡️ Gemiddelde temperatuur:${nbsp}${data.avond.temperatuur.toFixed(1)}°C
💧 Regen:${nbsp}${data.avond.regen.toFixed(1)} mm`;
}

// Lees templatebestand
function loadTemplate() {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(`Templatebestand niet gevonden: ${TEMPLATE_PATH}`);
  }
  return fs.readFileSync(TEMPLATE_PATH, "utf8");
}

// Haal actuele weerdata op via weather-today.js
async function getLatestWeather() {
  return new Promise((resolve, reject) => {
    exec("node weather-today.js", (error, stdout, stderr) => {
      if (error) {
        return reject(`Fout bij uitvoeren weather script: ${error.message}`);
      }

      // Zoek JSON-achtige data met regex
      const match = stdout.match(/({[\s\S]*})/);
      if (!match) {
        return reject("Geen geldige JSON of data gevonden in output.");
      }

      try {
        const result = JSON.parse(match[0]);
        resolve(result);
      } catch (e) {
        console.warn("Kon JSON niet parsen:", e.message);
        return reject("Kan output niet omzetten naar geldige JSON.");
      }
    });
  });
}

// Stuur notificatie via Telegram
async function sendWeatherMessage(data) {
  let message = loadTemplate();
  message = message.replace("{{weather}}", formatWeather(data));

  try {
    await bot.sendMessage(process.env.TELEGRAM_WEATHER_CHAT_ID, message, {
      parse_mode: "HTML",
    });
    console.log("🌤️ Weerbericht succesvol verzonden via Telegram.");
  } catch (err) {
    console.error("❌ Kon Telegram-weerbericht niet verzenden:", err.message);
  }
}

// Hoofdfunctie
async function runWeatherCheck() {
  try {
    const weatherData = await getLatestWeather();
    await sendWeatherMessage(weatherData);
  } catch (err) {
    console.error("🚨 Er ging iets mis met het weerbericht:", err.message);
  }
}

runWeatherCheck();
