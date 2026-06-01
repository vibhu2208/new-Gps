/**
 * Replace location_name in data/local-road/*.csv with the official site name.
 * Usage: node scripts/update-site-location-csv.js
 */
const fs = require('fs');
const path = require('path');

const SITE_NAME =
  'Bandhwari Gurgaon Faridabad Combined Solid Waste Management Facility';

const OLD =
  'Gurgaon Faridabad Combined Solid Waste Management Facility';

const dir = path.join(__dirname, '../data/local-road');
if (!fs.existsSync(dir)) {
  console.log('No data/local-road directory — skip CSV update');
  process.exit(0);
}

for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.csv'))) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const before = content.length;
  content = content.split(OLD).join(SITE_NAME);
  content = content.replace(/,Site \d+,/g, `,${SITE_NAME},`);
  fs.writeFileSync(filePath, content);
  console.log(`✅ ${file} (${((content.length - before) / 1024).toFixed(0)} KB delta)`);
}

console.log('\nDone. Re-run: npm run db:push');
