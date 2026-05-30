/**
 * Add or update a vehicle in MongoDB
 */

const { MongoClient } = require('mongodb');
const path = require('path');
const { uri, dbName } = require('./mongodb-config');

async function addVehicle(vehicleData) {
  const client = new MongoClient(uri, { 
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000 
  });
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(dbName);
    const vehiclesCollection = db.collection('vehicles');
    
    console.log(`\n📦 Adding/updating vehicle ${vehicleData.id}...`);
    
    await vehiclesCollection.updateOne(
      { id: vehicleData.id },
      { $set: vehicleData },
      { upsert: true }
    );
    
    console.log(`✅ Vehicle ${vehicleData.id} added/updated successfully`);
    
  } catch (error) {
    console.error('❌ Error adding vehicle:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Read from vehicles.json
const fs = require('fs');
const vehiclesPath = path.join(__dirname, '../data/vehicles.json');
const vehicles = JSON.parse(fs.readFileSync(vehiclesPath, 'utf-8'));

// Find vehicle by ID from command line or default to HR38T3206
const vehicleId = process.argv[2] || 'HR38T3206';
const vehicle = vehicles.find(v => v.id === vehicleId);

if (vehicle) {
  addVehicle(vehicle);
} else {
  console.error('❌ Vehicle HR38T8618 not found in vehicles.json');
  process.exit(1);
}

