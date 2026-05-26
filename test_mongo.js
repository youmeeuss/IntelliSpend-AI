const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.log("❌ Error: MONGODB_URI is not defined in .env.local file.");
  process.exit(1);
}

console.log(`Connecting to MongoDB at: ${uri.replace(/:([^:@]+)@/, ':****@')} ...`);

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("✅ Success! Successfully connected to MongoDB.");
    const db = client.db('intellispend');
    const collections = await db.listCollections().toArray();
    console.log(`Available collections: ${collections.map(c => c.name).join(', ') || 'none (empty database)'}`);
  } catch (err) {
    console.error("❌ Connection failed with error:", err.message);
  } finally {
    await client.close();
  }
}

run();
