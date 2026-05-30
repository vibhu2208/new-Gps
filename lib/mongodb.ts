import { MongoClient, Db } from 'mongodb';

const uriRaw = process.env.MONGODB_URI;
if (!uriRaw) {
  throw new Error('MONGODB_URI environment variable is not set');
}
const uri: string = uriRaw;
const dbName = process.env.MONGODB_DB_NAME || 'gps_tracker';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  try {
    if (!client) {
      client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        family: 4,
      });
      await client.connect();
    }
    
    db = client.db(dbName);
    console.log('✅ Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('✅ MongoDB connection closed');
  }
}

export function getDatabase(): Db | null {
  return db;
}

