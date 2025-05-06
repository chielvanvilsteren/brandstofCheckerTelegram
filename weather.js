import fetch from "node-fetch";

async function getWeatherForecast() {
  const latitude = 52.2461; // Deventer
  const longitude = 6.1846;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,precipitation_probability,precipitation&timezone=Europe/Amsterdam`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const times = data.hourly.time;
    const temps = data.hourly.temperature_2m;
    const precipitation = data.hourly.precipitation;

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const periods = {
      morning: { start: "06:00", end: "12:00", temp: [], rain: [] },
      afternoon: { start: "12:00", end: "18:00", temp: [], rain: [] },
      evening: { start: "18:00", end: "24:00", temp: [], rain: [] },
    };

    for (let i = 0; i < times.length; i++) {
      const time = times[i];
      const temp = temps[i];
      const rain = precipitation[i];

      if (!time.startsWith(today)) continue;

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

    console.log("\n🌤️ Weersvoorspelling voor vandaag in Deventer:\n");
    console.log(`🌅 Ochtend (06:00 – 12:00):`);
    console.log(
      `Gemiddelde temperatuur: ${
        periods.morning.temp.length > 0
          ? avg(periods.morning.temp).toFixed(1)
          : "geen data"
      } °C`
    );
    console.log(
      `Verwachte regen: ${periods.morning.rain
        .reduce((a, b) => a + b, 0)
        .toFixed(1)} mm`
    );

    console.log(`\n🌇 Middag (12:00 – 18:00):`);
    console.log(
      `Gemiddelde temperatuur: ${
        periods.afternoon.temp.length > 0
          ? avg(periods.afternoon.temp).toFixed(1)
          : "geen data"
      } °C`
    );
    console.log(
      `Verwachte regen: ${periods.afternoon.rain
        .reduce((a, b) => a + b, 0)
        .toFixed(1)} mm`
    );

    console.log(`\n🌃 Avond (18:00 – 24:00):`);
    console.log(
      `Gemiddelde temperatuur: ${
        periods.evening.temp.length > 0
          ? avg(periods.evening.temp).toFixed(1)
          : "geen data"
      } °C`
    );
    console.log(
      `Verwachte regen: ${periods.evening.rain
        .reduce((a, b) => a + b, 0)
        .toFixed(1)} mm\n`
    );
  } catch (error) {
    console.error("Fout bij ophalen van de weersvoorspelling:", error.message);
  }
}

getWeatherForecast();
