// logger.js
const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "../logs");

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

function getLocalTimestamp() {
  const now = new Date();

  // Gebruik toLocaleString met tijdzone voor Nederland
  const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Europe/Amsterdam",
  };

  const localTime = now.toLocaleString("nl-NL", options);

  // Format naar: YYYY-MM-DD HH:MM:SS
  const [datePart, timePart] = localTime.split(" ");
  return `${datePart} ${timePart}`;
}

function writeLog(file, message) {
  const timestamp = getLocalTimestamp();
  const line = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(path.join(LOG_DIR, file), line);
}

module.exports = {
  log(message) {
    writeLog("weather.log", message);
  },
  error(message) {
    writeLog("error.log", `ERROR: ${message}`);
  },
};
