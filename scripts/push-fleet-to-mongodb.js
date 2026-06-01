/**
 * Push fleet vehicles + GPS routes (from CSV) to MongoDB for Vercel production.
 * Does not load the full routes.json into memory.
 *
 * Usage: node scripts/push-fleet-to-mongodb.js
 */
const { execSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');

require('dotenv').config({ path: path.join(root, '.env.local') });
require('dotenv').config({ path: path.join(root, '.env') });

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set in .env');
  process.exit(1);
}

function run(script, args = '') {
  console.log(`\n▶ node scripts/${script} ${args}\n`);
  execSync(`node scripts/${script} ${args}`, { cwd: root, stdio: 'inherit' });
}

console.log('Pushing fleet to MongoDB for live dashboard...\n');

run('update-vehicles-mongodb.js');
run('sync-vehicle-status.js');

const localRoad = path.join(root, 'data/local-road');
const fs = require('fs');
if (!fs.existsSync(localRoad)) {
  console.error('❌ No data/local-road/*.csv found. Run generate-local-road-gps.js first.');
  process.exit(1);
}

const csvFiles = fs.readdirSync(localRoad).filter((f) => f.endsWith('.csv'));
for (const file of csvFiles) {
  const vehicleId = path.basename(file, '.csv');
  run('convert-local-road-to-routes.js', vehicleId);
}

console.log('\n✨ Fleet pushed to MongoDB.');
console.log('   1. Vercel → Settings → Environment Variables:');
console.log('      MONGODB_URI, MONGODB_DB_NAME=gps_tracker, USE_LOCAL_DATA=false');
console.log('   2. Redeploy, then open: https://YOUR-APP.vercel.app/api/health');
