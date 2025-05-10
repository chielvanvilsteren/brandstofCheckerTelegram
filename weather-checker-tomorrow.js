// weather-checker-tomorrow.js

const fs = require("fs");
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");
const dotenv = require("dotenv");

// Importeer logger
const { log, error } = require("./logger/logger.js");

const {
  getWeatherForecast,
  formatDate,
  formatEuropeanDate,
} = require("./weather-tomorrow.js");
// Importeer logger


dotenv.config();

// Telegram bot initialiseren
const bot = new TelegramBot(process.env.TELEGRAM_WEATHER_BOT_TOKEN, {
  polling: false,
});

// Pad naar templatebestand
const TEMPLATE_PATH = path.resolve(
  process.cwd(),
  "telegram-templates",
  "weather.txt"
);

// Formatteer weerbericht voor Telegram
function formatWeather(data) {
  return `
  <b>Goedenavond! </b> 🌙
  🌤️ <b>Weersvoorspelling voor morgen in Deventer</b> (${data.datum})
  
  🌅 <b>Ochtend (06:00 – 12:00)</b>
  🌡️ Temperatuur: ${data.ochtend.temperatuur?.toFixed(1) ?? "N/A"}°C
  💧 Regen: ${data.ochtend.regen.toFixed(1)} mm
  
  🌇 <b>Middag (12:00 – 18:00)</b>
  🌡️ Temperatuur: ${data.middag.temperatuur?.toFixed(1) ?? "N/A"}°C
  💧 Regen: ${data.middag.regen.toFixed(1)} mm
  
  🌃 <b>Avond (18:00 – 24:00)</b>
  🌡️ Temperatuur: ${data.avond.temperatuur?.toFixed(1) ?? "N/A"}°C
  💧 Regen: ${data.avond.regen.toFixed(1)} mm
  `;
}

// Lees templatebestand
function loadTemplate() {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    error(`Templatebestand niet gevonden: ${TEMPLATE_PATH}`);
    throw new Error(`Templatebestand niet gevonden: ${TEMPLATE_PATH}`);
  }
  return fs.readFileSync(TEMPLATE_PATH, "utf8");
}

// Stuur notificatie via Telegram
async function sendWeatherMessage(data) {
  let message = loadTemplate();
  message = message.replace("{{weather}}", formatWeather(data));

  try {
    await bot.sendMessage(process.env.TELEGRAM_WEATHER_CHAT_ID, message, {
      parse_mode: "HTML",
    });
    log("🌤️ Weerbericht voor morgen succesvol verzonden via Telegram.");
  } catch (err) {
    error(`❌ Kon Telegram-weerbericht niet verzenden: ${err.message}`);
  }
}

// Hoofdfunctie
async function runWeatherCheck() {
  try {
    log("🔄 Start weerchecker voor morgen...");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatDate(tomorrow); // YYYY-MM-DD
    const tomorrowDisplay = formatEuropeanDate(tomorrow); // "5 mei 2025"

    const weatherData = await getWeatherForecast(tomorrowStr);

    // Vervang de korte datum door de uitgeschreven versie
    weatherData.datum = tomorrowDisplay;

    await sendWeatherMessage(weatherData);
    log("✅ Weerchecker voor morgen succesvol afgerond.");
  } catch (err) {
    error(`🚨 Er ging iets mis met het weerbericht: ${err.message}`);
  }
}

runWeatherCheck();
