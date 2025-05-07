// server.js
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 80;

const LOG_PATH = path.join(__dirname, "../logs/weather.log");
const ERROR_LOG_PATH = path.join(__dirname, "../logs/error.log");

app.use(express.static(path.join(__dirname, "../public")));

// Toon normale logs
app.get("/api/logs", (req, res) => {
  if (!fs.existsSync(LOG_PATH)) {
    return res.send("Geen logs gevonden.");
  }

  const data = fs.readFileSync(LOG_PATH, "utf8");
  res.type("text/plain");
  res.send(data);
});

// Toon error logs
app.get("/api/errors", (req, res) => {
  if (!fs.existsSync(ERROR_LOG_PATH)) {
    return res.send("Geen foutmeldingen gevonden.");
  }

  const data = fs.readFileSync(ERROR_LOG_PATH, "utf8");
  res.type("text/plain");
  res.send(data);
});

app.listen(PORT, () => {
  console.log(`🌐 Logviewer draait op http://localhost:${PORT}`);
});
