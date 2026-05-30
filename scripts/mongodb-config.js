const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
if (!process.env.MONGODB_URI) {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'gps_tracker';

if (!uri) {
  throw new Error('MONGODB_URI is not set in .env or .env.local');
}

module.exports = { uri, dbName };
