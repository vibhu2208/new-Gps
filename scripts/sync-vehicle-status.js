/**
 * Set vehicle status to "moving" if route data exists, then push to MongoDB.
 * Usage: node scripts/sync-vehicle-status.js
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const { uri, dbName } = require('./mongodb-config');

const fleetPath = path.join(__dirname, '../data/local-fleet-config.json');
const vehiclesPath = path.join(__dirname, '../data/vehicles.json');
const routesPath = path.join(__dirname, '../public/data/routes.json');

const fleet = JSON.parse(fs.readFileSync(fleetPath, 'utf-8'));
const routes = fs.existsSync(routesPath) ? JSON.parse(fs.readFileSync(routesPath, 'utf-8')) : {};

const vehicles = fleet.vehicles.map((entry) => {
  const hasRoutes = routes[entry.id] && Object.keys(routes[entry.id]).length > 0;
  return {
    id: entry.id,
    name: entry.name,
    plateNumber: entry.plateNumber,
    status: hasRoutes ? 'moving' : entry.center ? 'idle' : 'offline',
    lastSeen: hasRoutes ? new Date().toISOString() : new Date('2026-01-01').toISOString(),
    driver: entry.driver,
    model: entry.model,
    color: entry.color,
    city: entry.city,
    ward: entry.ward,
  };
});

fs.writeFileSync(vehiclesPath, JSON.stringify(vehicles, null, 2));
console.log('Updated vehicles.json:');
for (const v of vehicles) {
  const days = routes[v.id] ? Object.keys(routes[v.id]).length : 0;
  console.log(`  ${v.id}: ${v.status} (${days} route days)`);
}

async function pushToMongo() {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });
  await client.connect();
  const collection = client.db(dbName).collection('vehicles');
  for (const vehicle of vehicles) {
    await collection.updateOne({ id: vehicle.id }, { $set: vehicle }, { upsert: true });
  }
  await client.close();
  console.log('\nMongoDB vehicles collection updated.');
}

pushToMongo().catch((err) => {
  console.warn('\nMongoDB update failed — run locally:', err.message);
  console.warn('  node scripts/sync-vehicle-status.js');
});
