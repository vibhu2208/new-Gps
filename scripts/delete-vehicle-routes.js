/**
 * Delete all route data for a vehicle from MongoDB and routes.json
 * Usage: node scripts/delete-vehicle-routes.js VEHICLE-01
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const { uri, dbName } = require('./mongodb-config');

const vehicleId = process.argv[2];
if (!vehicleId) {
  console.error('Usage: node scripts/delete-vehicle-routes.js <vehicleId>');
  process.exit(1);
}

const routesPath = path.join(__dirname, '../public/data/routes.json');
const csvPath = path.join(__dirname, `../data/local-road/${vehicleId}.csv`);

async function deleteFromMongo() {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });
  try {
    await client.connect();
    const result = await client.db(dbName).collection('routes').deleteMany({ vehicleId });
    console.log(`MongoDB: deleted ${result.deletedCount} route days for ${vehicleId}`);
  } catch (error) {
    console.warn('MongoDB delete skipped:', error.message);
  } finally {
    await client.close();
  }
}

function deleteFromRoutesJson() {
  if (!fs.existsSync(routesPath)) return;
  const routes = JSON.parse(fs.readFileSync(routesPath, 'utf-8'));
  if (routes[vehicleId]) {
    delete routes[vehicleId];
    fs.writeFileSync(routesPath, JSON.stringify(routes, null, 2));
    console.log(`routes.json: removed ${vehicleId}`);
  }
}

function deleteCsv() {
  if (fs.existsSync(csvPath)) {
    fs.unlinkSync(csvPath);
    console.log(`Deleted ${csvPath}`);
  }
}

deleteCsv();
deleteFromRoutesJson();
deleteFromMongo().then(() => console.log('Done.'));
