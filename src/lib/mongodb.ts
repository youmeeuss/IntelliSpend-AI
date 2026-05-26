import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

export const isMongoEnabled = !!uri;

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

if (isMongoEnabled && uri) {
  if (process.env.NODE_ENV === 'development') {
    // Preserve client across HMR reloads
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }
}

export async function getDb() {
  if (!isMongoEnabled || !clientPromise) return null;
  const connectedClient = await clientPromise;
  return connectedClient.db('intellispend');
}
