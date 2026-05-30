/**
 * Seed 6 local fleet vehicles into MongoDB + vehicles.json
 * Generate GPS for vehicles that have coordinates in local-fleet-config.json
 *
 * Usage:
 *   node scripts/seed-local-fleet.js
 *   node scripts/seed-local-fleet.js --vehicle-index 1
 *   node scripts/seed-local-fleet.js --skip-generate
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const { uri, dbName } = require('./mongodb-config');
const { execSync } = require('child_process');

const FLEET_CONFIG_PATH = path.join(__dirname, '../data/local-fleet-config.json');
const VEHICLES_PATH = path.join(__dirname, '../data/vehicles.json');

function loadFleetConfig() {
  return JSON.parse(fs.readFileSync(FLEET_CONFIG_PATH, 'utf-8'));
}

function buildVehicleRecord(entry, hasRouteData) {
  return {
    id: entry.id,
    name: entry.name,
    plateNumber: entry.plateNumber,
    status: hasRouteData ? 'moving' : entry.center ? 'idle' : 'offline',
    lastSeen: hasRouteData ? new Date().toISOString() : new Date('2026-01-01').toISOString(),
    driver: entry.driver,
    model: entry.model,
    color: entry.color,
    city: entry.city,
    ward: entry.ward,
  };
}

async function seedVehiclesToMongo(vehicles) {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('vehicles');

    for (const vehicle of vehicles) {
      await collection.updateOne({ id: vehicle.id }, { $set: vehicle }, { upsert: true });
      console.log(`  Vehicle ${vehicle.id} → ${vehicle.status}`);
    }
    console.log(`Seeded ${vehicles.length} vehicles to MongoDB`);
  } finally {
    await client.close();
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = { vehicleIndex: null, skipGenerate: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--vehicle-index' && args[i + 1]) options.vehicleIndex = parseInt(args[++i], 10);
    if (args[i] === '--skip-generate') options.skipGenerate = true;
  }
  return options;
}

async function main() {
  const options = parseArgs();
  const fleet = loadFleetConfig();

  const vehiclesWithCoords = fleet.vehicles.filter((v) => v.center?.lat && v.center?.lng);
  const targetIndexes = options.vehicleIndex
    ? [options.vehicleIndex]
    : vehiclesWithCoords.map((v) => v.index);

  if (!options.skipGenerate) {
    for (const index of targetIndexes) {
      console.log(`\nGenerating GPS for vehicle index ${index}...`);
      execSync(`node scripts/generate-local-road-gps.js --vehicle-index ${index}`, {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
      });
      const vehicle = fleet.vehicles.find((v) => v.index === index);
      console.log(`Importing routes for ${vehicle.id}...`);
      try {
        execSync(`node scripts/convert-local-road-to-routes.js ${vehicle.id}`, {
          cwd: path.join(__dirname, '..'),
          stdio: 'inherit',
        });
      } catch (error) {
        console.warn(`Route import warning for ${vehicle.id}:`, error.message);
      }
    }
  }

  const generatedIds = new Set(
    targetIndexes.map((index) => fleet.vehicles.find((v) => v.index === index)?.id).filter(Boolean)
  );

  const vehicleRecords = fleet.vehicles.map((entry) =>
    buildVehicleRecord(entry, generatedIds.has(entry.id))
  );

  fs.writeFileSync(VEHICLES_PATH, JSON.stringify(vehicleRecords, null, 2));
  console.log(`\nWrote ${vehicleRecords.length} vehicles → ${VEHICLES_PATH}`);

  await seedVehiclesToMongo(vehicleRecords).catch((error) => {
    console.warn('\nMongoDB vehicle seed skipped (run locally):', error.message);
    console.warn('  node scripts/update-vehicles-mongodb.js');
  });
  console.log('\nDone. Refresh /dashboard/vehicles to see all 6 vehicles.');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
