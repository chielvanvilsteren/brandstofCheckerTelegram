// weather-checker-tomorrow.js

import {
  getWeatherForecast,
  formatDate,
  formatEuropeanDate,
} from "./weather-tomorrow.js";

import fs from "fs";
import path from "path";
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";

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
  🌤️ <b>Weersvoorspelling voor morgen</b> (${data.datum})
  
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
    console.log("🌤️ Weerbericht succesvol verzonden via Telegram.");
  } catch (err) {
    console.error("❌ Kon Telegram-weerbericht niet verzenden:", err.message);
  }
}

// Hoofdfunctie
async function runWeatherCheck() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatDate(tomorrow); // YYYY-MM-DD
    const tomorrowDisplay = formatEuropeanDate(tomorrow); // "5 mei 2025"

    console.log("\n🌙 [AVOND] Ophalen weersvoorspelling voor MORGEN...");
    const weatherData = await getWeatherForecast(tomorrowStr);

    // Vervang de korte datum door de uitgeschreven versie
    weatherData.datum = tomorrowDisplay;

    await sendWeatherMessage(weatherData);
  } catch (err) {
    console.error("🚨 Er ging iets mis met het weerbericht:", err.message);
  }
}

runWeatherCheck();
