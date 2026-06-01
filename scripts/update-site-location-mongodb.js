/**
 * Update site name on all vehicles and route points in MongoDB.
 * Usage: node scripts/update-site-location-mongodb.js
 */
const { MongoClient } = require('mongodb');
const path = require('path');
const { uri, dbName } = require('./mongodb-config');

const SITE_NAME =
  'Bandhwari Gurgaon Faridabad Combined Solid Waste Management Facility';

const LEGACY_NAMES = [
  'Gurgaon Faridabad Combined Solid Waste Management Facility',
  /^Site \d+$/i,
];

async function main() {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 20000 });
  await client.connect();
  const db = client.db(dbName);

  const vehicles = await db.collection('vehicles').updateMany(
    {},
    { $set: { city: SITE_NAME } }
  );
  console.log(`✅ Vehicles updated: ${vehicles.modifiedCount}`);

  const routesCol = db.collection('routes');
  const cursor = routesCol.find({});
  let routeDocs = 0;
  let pointsUpdated = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (!doc?.points?.length) continue;

    let changed = false;
    for (const point of doc.points) {
      const loc = point.location;
      const isLegacy =
        !loc ||
        LEGACY_NAMES.some((n) => (typeof n === 'string' ? loc === n : n.test(loc)));
      if (isLegacy) {
        point.location = SITE_NAME;
        pointsUpdated++;
        changed = true;
      }
    }

    if (changed) {
      await routesCol.updateOne(
        { _id: doc._id },
        { $set: { points: doc.points, updatedAt: new Date() } }
      );
      routeDocs++;
    }
  }

  console.log(`✅ Route documents updated: ${routeDocs} (${pointsUpdated} points)`);
  await client.close();
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
