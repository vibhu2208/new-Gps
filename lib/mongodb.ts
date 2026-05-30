import { MongoClient, Db } from 'mongodb';

const dbName = process.env.MONGODB_DB_NAME || 'gps_tracker';

type MongoGlobal = typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

const globalForMongo = globalThis as MongoGlobal;

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  return uri;
}

function getClientPromise(): Promise<MongoClient> {
  if (!globalForMongo._mongoClientPromise) {
    const client = new MongoClient(getMongoUri(), {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });
    globalForMongo._mongoClientPromise = client.connect();
  }
  return globalForMongo._mongoClientPromise;
}

export async function connectToDatabase(): Promise<Db> {
  try {
    const client = await getClientPromise();
    return client.db(dbName);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  if (globalForMongo._mongoClientPromise) {
    const client = await globalForMongo._mongoClientPromise;
    await client.close();
    globalForMongo._mongoClientPromise = undefined;
    console.log('MongoDB connection closed');
  }
}
