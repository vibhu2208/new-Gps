/**
 * Convert local-road/*.csv → routes.json + MongoDB
 *
 * Usage:
 *   node scripts/convert-local-road-to-routes.js
 *   node scripts/convert-local-road-to-routes.js VEHICLE-01
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const { uri, dbName } = require('./mongodb-config');

const localRoadDir = path.join(__dirname, '../data/local-road');
const outputFilePath = path.join(__dirname, '../public/data/routes.json');

function istToUtc(istTimestamp) {
  const [datePart, timePart] = istTimestamp.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second] = timePart.split(':').map(Number);
  const istDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  istDate.setUTCHours(istDate.getUTCHours() - 5);
  istDate.setUTCMinutes(istDate.getUTCMinutes() - 30);
  return istDate.toISOString();
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateSpeed(lat1, lng1, lat2, lng2, timeDiffMinutes) {
  if (timeDiffMinutes === 0) return 0;
  return Math.round((calculateDistance(lat1, lng1, lat2, lng2) / timeDiffMinutes) * 60);
}

async function saveToMongoDB(routes) {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });
  try {
    await client.connect();
    const db = client.db(dbName);
    const routesCollection = db.collection('routes');
    let totalPoints = 0;
    let totalDays = 0;

    for (const [vehicleId, vehicleRoutes] of Object.entries(routes)) {
      for (const [date, routeData] of Object.entries(vehicleRoutes)) {
        await routesCollection.updateOne(
          { vehicleId, date },
          {
            $set: {
              vehicleId,
              date,
              points: routeData.points || [],
              summary: routeData.summary || {},
              updatedAt: new Date(),
            },
            $setOnInsert: { createdAt: new Date() },
          },
          { upsert: true }
        );
        totalPoints += (routeData.points || []).length;
        totalDays++;
      }
    }
    console.log(`Saved ${totalDays} days, ${totalPoints} points to MongoDB`);
  } finally {
    await client.close();
  }
}

function parseCsvFile(csvFilePath) {
  const lines = fs.readFileSync(csvFilePath, 'utf-8').split('\n').filter((l) => l.trim());
  const routes = {};

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].trim().split(',');
    if (parts.length < 7) continue;

    const [timestamp, vehicle, , phase, locationName, latStr, lngStr] = parts;
    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lngStr);
    const date = timestamp.split(' ')[0];

    if (!routes[vehicle]) routes[vehicle] = {};
    if (!routes[vehicle][date]) {
      routes[vehicle][date] = {
        points: [],
        summary: { totalDistance: 0, drivingDuration: 0, idleDuration: 0, maxSpeed: 0 },
      };
    }

    routes[vehicle][date].points.push({
      lat: latitude,
      lng: longitude,
      timestamp: istToUtc(timestamp),
      speed: 0,
      location: locationName,
      status: phase,
      phase,
      isStop: phase === 'BREAK' || phase === 'WORKING',
    });
  }

  for (const vehicle of Object.keys(routes)) {
    for (const date of Object.keys(routes[vehicle])) {
      const points = routes[vehicle][date].points;
      let totalDistance = 0;
      let drivingDuration = 0;
      let idleDuration = 0;
      let maxSpeed = 0;

      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        totalDistance += calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
        const timeDiff =
          (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 60000;
        const speed = calculateSpeed(prev.lat, prev.lng, curr.lat, curr.lng, timeDiff);
        curr.speed = speed;
        maxSpeed = Math.max(maxSpeed, speed);

        if (curr.phase === 'WORKING' && speed > 5) drivingDuration += timeDiff;
        else if (curr.phase === 'WORKING' || curr.phase === 'BREAK') idleDuration += timeDiff;
        else drivingDuration += timeDiff;
      }

      routes[vehicle][date].summary = {
        totalDistance: parseFloat(totalDistance.toFixed(2)),
        drivingDuration: Math.round(drivingDuration),
        idleDuration: Math.round(idleDuration),
        maxSpeed: Math.round(maxSpeed),
      };
    }
  }

  return routes;
}

function main() {
  const targetVehicle = process.argv[2];
  let csvFiles = [];

  if (targetVehicle) {
    const file = path.join(localRoadDir, `${targetVehicle}.csv`);
    if (!fs.existsSync(file)) {
      console.error(`CSV not found: ${file}`);
      process.exit(1);
    }
    csvFiles = [file];
  } else if (fs.existsSync(localRoadDir)) {
    csvFiles = fs.readdirSync(localRoadDir).filter((f) => f.endsWith('.csv')).map((f) => path.join(localRoadDir, f));
  }

  if (csvFiles.length === 0) {
    console.error('No CSV files found in data/local-road/');
    console.error('Run: node scripts/generate-local-road-gps.js --vehicle-index 1');
    process.exit(1);
  }

  let mergedRoutes = {};
  for (const csvFile of csvFiles) {
    console.log(`Parsing ${path.basename(csvFile)}...`);
    const routes = parseCsvFile(csvFile);
    for (const vehicle of Object.keys(routes)) {
      if (!mergedRoutes[vehicle]) mergedRoutes[vehicle] = {};
      Object.assign(mergedRoutes[vehicle], routes[vehicle]);
    }
  }

  let existingRoutes = {};
  if (fs.existsSync(outputFilePath)) {
    try {
      existingRoutes = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));
    } catch {
      existingRoutes = {};
    }
  }

  for (const vehicle of Object.keys(mergedRoutes)) {
    if (!existingRoutes[vehicle]) existingRoutes[vehicle] = {};
    Object.assign(existingRoutes[vehicle], mergedRoutes[vehicle]);
  }

  fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
  fs.writeFileSync(outputFilePath, JSON.stringify(existingRoutes, null, 2));
  console.log(`Routes JSON → ${outputFilePath}`);

  for (const vehicle of Object.keys(mergedRoutes)) {
    const dates = Object.keys(mergedRoutes[vehicle]);
    console.log(`  ${vehicle}: ${dates.length} days (${dates[0]} to ${dates[dates.length - 1]})`);
  }

  saveToMongoDB(mergedRoutes).catch((error) => {
    console.warn('\nMongoDB import skipped (run locally if needed):', error.message);
    console.warn('  node scripts/convert-local-road-to-routes.js', targetVehicle || '');
    console.warn('  node scripts/update-vehicles-mongodb.js');
  });
}

main();
