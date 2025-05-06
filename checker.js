// checker.js
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

// Pad naar resultatenbestand
const RESULTS_FILE = path.resolve(__dirname, "last-result.json");

// Telegram bot initialiseren
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

// Lees templatebestand
function loadTemplate(name) {
  const filePath = path.resolve(__dirname, "telegram-templates", `${name}.txt`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Templatebestand niet gevonden: ${filePath}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

// Functie om huidige prijzen op te halen
async function getLatestPrices() {
  return new Promise((resolve, reject) => {
    exec("node scrape.js", (error, stdout, stderr) => {
      if (error) {
        return reject(`Fout bij uitvoeren scraper: ${error.message}`);
      }

      // Probeer direct te parsen als JSON
      try {
        const result = JSON.parse(stdout);
        return resolve(result);
      } catch (e) {
        console.warn("Directe JSON-parse mislukt, probeer regex...");
      }

      // Zoek met regex naar eerste geldige JSON-array/object
      const match = stdout.match(/(\$$[\s\S]*\$|{[\s\S]*})/);
      if (!match) {
        return reject("Geen geldige JSON gevonden in output.");
      }

      try {
        const result = JSON.parse(match[0]);
        resolve(result);
      } catch (e) {
        reject(`Kan JSON niet parsen: ${e.message}`);
      }
    });
  });
}

// Lees vorige resultaten
function getLastPrices() {
  if (fs.existsSync(RESULTS_FILE)) {
    const data = fs.readFileSync(RESULTS_FILE, "utf8");
    return JSON.parse(data);
  }
  return null;
}

// Sla nieuwe resultaten op
function savePrices(prices) {
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(prices, null, 2), "utf8");
}

// Formatteer tankstations voor bericht
function formatStations(stations) {
  return stations
    .filter((s) => s.prijs !== "Onbekend")
    .map((s) => `🔹 <b>${s.naam}</b>: ${s.prijs}`)
    .join("\n");
}

// Formatteer prijsveranderingen
function formatChanges(oldStations, newStations) {
  return newStations
    .map((station, i) => {
      const oldPrice = oldStations[i]?.prijs;
      const newPrice = station.prijs;

      if (oldPrice && oldPrice !== newPrice) {
        return `🔸 <b>${station.naam}</b>: ⬅️ <i>${oldPrice}</i> ➡️ <b>${newPrice}</b>`;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

// Stuur notificatie via Telegram
function sendNotification(oldResults, newResults, forceSend = false) {
  const changed =
    oldResults && JSON.stringify(oldResults) !== JSON.stringify(newResults);

  let templateName = "";
  let replacements = {};

  if (!oldResults) {
    templateName = "first_run";
    replacements = {
      stations: formatStations(newResults),
    };
  } else if (changed) {
    templateName = "price_change";
    replacements = {
      changes: formatChanges(oldResults, newResults),
      stations: formatStations(newResults),
    };
  } else {
    templateName = "no_changes";
    replacements = {
      stations: formatStations(newResults),
    };
  }

  // Laad template
  let message = loadTemplate(templateName);

  // Vervang placeholders
  for (const [key, value] of Object.entries(replacements)) {
    message = message.replace(`{{${key}}}`, value);
  }

  // Verstuur bericht
  bot
    .sendMessage(process.env.TELEGRAM_CHAT_ID, message, { parse_mode: "HTML" })
    .then(() => {
      console.log("📩 Bericht succesvol verzonden via Telegram.");
    })
    .catch((err) => {
      console.error("❌ Kon Telegram-bericht niet verzenden:", err.message);
    });
}

// Hoofdfunctie
async function runCheck() {
  const SEND_ALWAYS = true; // Stuur ook bericht als er geen verandering is

  try {
    const newResults = await getLatestPrices();
    const oldResults = getLastPrices();

    if (!oldResults) {
      console.log("📌 Eerste keer uitgevoerd — sla huidige prijzen op.");
      savePrices(newResults);
      sendNotification([], newResults, true); // Stuur "eerste meting"-bericht
      return;
    }

    if (JSON.stringify(oldResults) !== JSON.stringify(newResults)) {
      console.log("🔔 Prijsverandering gedetecteerd!");
      sendNotification(oldResults, newResults);
    } else {
      console.log("✅ Geen prijsveranderingen.");
      if (SEND_ALWAYS) {
        console.log("📧 Verstuur statusbericht zonder wijzigingen...");
        sendNotification(oldResults, newResults, true);
      }
    }

    savePrices(newResults);
  } catch (err) {
    console.error("🚨 Er ging iets mis:", err.message);
  }
}

runCheck();
