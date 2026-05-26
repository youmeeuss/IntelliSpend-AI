const { initializeApp } = require('firebase/app');
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("❌ Error: Firebase configuration variables are missing in .env.local.");
  process.exit(1);
}

console.log("Connecting to Firebase project:", firebaseConfig.projectId);

try {
  const app = initializeApp(firebaseConfig);
  console.log("✅ Success! Firebase App initialized successfully.");

  // Test connection to Firebase Auth Endpoint
  const https = require('https');
  const checkUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`;

  console.log("Checking API key connection to Identity Services gateway...");
  https.get(checkUrl, (res) => {
    // Identity gateway returns 400 (Bad Request / Missing credentials) when the key is valid,
    // and 400 (API_KEY_INVALID) if the key is wrong. Let's read the response.
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(body);
        if (json.error && json.error.message === 'API_KEY_INVALID') {
          console.error("❌ Error: Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is invalid.");
        } else if (res.statusCode === 400) {
          console.log("✅ Success! Firebase API Gateway successfully validated the API key.");
        } else {
          console.log(`ℹ️ Gateway response status: ${res.statusCode}`);
        }
      } catch (err) {
        console.log(`✅ Success! Communicated with Auth Gateway (Status: ${res.statusCode}).`);
      }
    });
  }).on('error', (err) => {
    console.error("❌ Gateway connection error:", err.message);
  });
} catch (e) {
  console.error("❌ Failed to initialize Firebase App:", e.message);
}
