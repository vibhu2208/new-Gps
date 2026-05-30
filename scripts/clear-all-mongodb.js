/**
 * Delete ALL documents from every collection in the GPS tracker database.
 * Usage: node scripts/clear-all-mongodb.js
 */

const { MongoClient } = require('mongodb');
const path = require('path');

const { uri, dbName } = require('./mongodb-config');

async function clearAll() {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
  });

  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();

    if (collections.length === 0) {
      console.log(`Database "${dbName}" has no collections (already empty).`);
      return;
    }

    console.log(`Database: ${dbName}\n`);
    for (const { name } of collections) {
      const before = await db.collection(name).countDocuments();
      const result = await db.collection(name).deleteMany({});
      console.log(`  ${name}: deleted ${result.deletedCount} (was ${before})`);
    }

    console.log('\nAll MongoDB collections cleared.');
  } catch (error) {
    console.error('Failed to clear database:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

clearAll();
