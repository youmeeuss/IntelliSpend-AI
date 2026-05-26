# Cloud Deployment Guide: IntelliSpend AI

This document provides step-by-step instructions for deploying the **IntelliSpend AI** frontend, Python ML backend, and database to live cloud servers for production.

---

## 💾 1. Database Deployment: MongoDB Atlas

1. **Sign Up / Log In**: Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and log in.
2. **Create a Database Cluster**:
   - Choose the **M0 Shared Free Tier** cluster.
   - Select your preferred cloud provider (e.g. AWS) and nearest region.
   - Click **Create**.
3. **Database Access & Security**:
   - In **Database Access**, create a database user (e.g., username: `sujitha_123`, password: `your_secure_password`). Keep role as *Read and Write to any Database*.
   - In **Network Access**, click **Add IP Address** and choose **Allow Access from Anywhere (`0.0.0.0/0`)** to allow Vercel/Render serverless functions to connect.
4. **Get the Connection URI**:
   - Click **Connect** on your cluster.
   - Choose **Drivers** (Node.js).
   - Copy the connection string. It will look like:
     `mongodb+srv://<username>:<password>@cluster0.zr7fu1h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
   - Replace `<username>` and `<password>` with the credentials you created.
   - Change the database name in the path to `/intellispend` or similar.

---

## 🐍 2. Backend Deployment: Python FastAPI ML Engine

Since Vercel cannot run native Python processes (`python3` + `scikit-learn` libraries) in serverless environments, we run our ML models as a standalone **FastAPI service**.

### Option A: Render (Free Tier)
1. Go to [Render](https://render.com/) and connect your GitHub repository.
2. Click **New** -> **Web Service**.
3. Select the `Raseed-AI` repository.
4. Configure details:
   - **Name**: `intellispend-ml`
   - **Environment**: `Docker` (Render automatically detects the `ml/Dockerfile`!)
   - **Docker Path**: `ml/Dockerfile`
   - **Docker Context**: `ml/` (or leave root if path is relative)
     *Alternatively, set Environment to **Python**, Build Command to `pip install -r ml/requirements.txt`, and Start Command to `uvicorn ml.main:app --host 0.0.0.0 --port 10000`.*
   - **Instance Type**: **Free**
5. Click **Deploy Web Service**. Render will build the container and provide a live URL (e.g., `https://intellispend-ml.onrender.com`).

### Option B: Railway
1. Go to [Railway](https://railway.app/) and sign in.
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Choose the repository and choose the `/ml` directory or use the root Dockerfile.
4. Railway will build the container, expose port `8000`, and generate a live URL.

---

## 🌐 3. Frontend Deployment: Next.js Web App

### Option A: Vercel (Recommended)
1. Go to [Vercel](https://vercel.com/) and log in using GitHub.
2. Click **Add New** -> **Project**.
3. Import the `Raseed-AI` repository.
4. Configure **Environment Variables** (crucial step!):
   - Add the following keys under the *Environment Variables* accordion:
     - `GEMINI_API_KEY`: Your Google Gemini API Key.
     - `MONGODB_URI`: The connection URI obtained from MongoDB Atlas.
     - `ML_API_URL`: The URL of your deployed Render/Railway Python backend (e.g., `https://intellispend-ml.onrender.com`).
     - `NEXT_PUBLIC_FIREBASE_API_KEY`: Your Firebase API key.
     - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Firebase auth domain.
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Firebase project ID.
     - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Firebase storage bucket.
     - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender ID.
     - `NEXT_PUBLIC_FIREBASE_APP_ID`: Firebase app ID.
5. Click **Deploy**. Vercel will build and host your Next.js application live!

### Option B: Netlify
1. Go to [Netlify](https://www.netlify.com/) and import the repository.
2. Set the build command to `npm run build` and publish directory to `.next`.
3. Configure the same Environment Variables under the site settings.
4. Deploy the site.

---

## 🎓 4. Viva Presentation Highlights: "Fully Live Cloud App"

When presenting this final-year project to examiners (viva), emphasize these design patterns to make a high-fidelity impression:

1. **Architecture Separation (Frontend & Backend)**:
   > *"Sir/Madam, the application uses a microservices-style decoupled architecture. The frontend web portal runs as a serverless Next.js app on Vercel. Our Machine Learning models (Regression, Naive Bayes, Decision Trees) run inside a high-performance Python FastAPI service containerized with Docker on Render/Railway. If the live ML backend experiences latency, the frontend has a client-side TypeScript fallback algorithm to maintain zero service downtime."*

2. **Database Cloud Scalability**:
   > *"All user profiles, transaction vaults, receipt line items, and Copilot chat histories are persisted in real-time to a cloud MongoDB Atlas database. The connection leverages connection pooling to prevent socket leakage and ensure serverless hot-reloads execute efficiently."*

3. **Multi-Model ML Integration**:
   > *"Instead of using simple rules, we trained Scikit-learn models on consumer spending trends. Linear Regression predicts next month outflow rates, Naive Bayes tokenizes and categorizes receipt vendors, and Decision Trees map investment splits based on user risk boundaries."*
