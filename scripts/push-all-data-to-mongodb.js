/**
 * Push all local data (vehicles, alerts, routes) to MongoDB.
 * Uses MONGODB_URI and MONGODB_DB_NAME from .env / .env.local
 *
 * Usage: node scripts/push-all-data-to-mongodb.js
 */

const { execSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');

function run(script) {
  console.log(`\n▶ node scripts/${script}\n`);
  execSync(`node scripts/${script}`, { cwd: root, stdio: 'inherit' });
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    require('dotenv').config({ path: path.join(root, '.env.local') });
    require('dotenv').config({ path: path.join(root, '.env') });
  }
  if (!process.env.MONGODB_URI) {
    console.error('Set MONGODB_URI in .env (password @ must be encoded as %40)');
    process.exit(1);
  }

  run('update-vehicles-mongodb.js');
  run('sync-vehicle-status.js');
  run('convert-local-road-to-routes.js');
  console.log('\n✨ All data pushed to MongoDB (vehicles, alerts, routes).');
  console.log('   Or use: node scripts/push-fleet-to-mongodb.js');
}

main().catch((err) => {
  console.error('\n❌ Push failed:', err.message);
  console.error('\nChecklist:');
  console.error('  1. MONGODB_URI uses Gps%402003 not Gps@2003 in the password');
  console.error('  2. Atlas → Network Access allows 0.0.0.0/0');
  console.error('  3. Cluster is running and credentials are correct');
  process.exit(1);
});
