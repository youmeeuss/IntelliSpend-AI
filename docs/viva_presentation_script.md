# 🎓 Viva Presentation Script: IntelliSpend AI

This guide is your presentation game-plan. It details exactly **what to click**, **what to explain**, and **how to answer** questions during your final project evaluation.

---

## 🖥️ Live Demonstration Steps (The "Wow" Walkthrough)

Perform these steps during your live demo to showcase all core functionalities:

| Step | Action to Perform | Key Commentary to Say |
| :--- | :--- | :--- |
| **1** | Open the `/auth` page and click **Login with Google** or choose the sandbox account. | *"The portal supports secure federated single sign-on (SSO). The client receives a cryptographically signed JWT token from Google Identity services, which is verified server-side on our database endpoints."* |
| **2** | Go to `/receipts/new` and drop/select a receipt image. Click **Start AI Extraction**. | *"Our AI OCR engine performs structural analysis. Notice the moving laser sweep visual scanning animation and the status steps telling us the exact parsing pipeline."* |
| **3** | Review the extracted line items table, then save the transaction. | *"The model doesn't just parse text; it validates math. It runs sum calculations and checks the database for duplication flags before writing to MongoDB Atlas."* |
| **4** | Go to the `/wallet` tab, click **Simulate UPI Pay**, enter the PIN, and authorize. | *"This simulator replicates payment checkouts. Listen to the synthesized payment chime—this is generated programmatically using browser oscillators instead of audio assets."* |
| **5** | Go to the `/analytics` dashboard. | *"Notice the Area and Radar trend charts. There is no fake seeded data; everything is computed in real-time from the database. It models spending density using a weekday intensity heatmap."* |
| **6** | Open `/predictions` and show the ML charts. | *"Our Python container runs an Ordinary Least Squares (OLS) regression to forecast next month's outflow limits and calculate model accuracy."* |

---

## ❓ Examiner Questions & Bulletproof Answers

Here are the most common questions examiners ask, along with professional responses:

> [!NOTE]
> **Q1: What happens if the database connection drops or is offline?**
> - **Answer**: *"Sir/Madam, the application uses a hybrid caching architecture. When database access or internet connectivity drops, the client context transparently falls back to parsing cached JSON transactions from browser `localStorage`. When the connection is restored, it re-synchronizes, preventing application crashes."*

> [!IMPORTANT]
> **Q2: How do you prevent NoSQL injection or database pollution attacks?**
> - **Answer**: *"We enforce strict type-casting and key-mapping sanitization on all MongoDB actions inside `db.ts`. All parameters are forced to string representations and mapped strictly to predefined object schemas before querying the collection. This blocks arbitrary JSON query injection parameters like `$ne` or `$gt` from reaching the driver."*

> [!TIP]
> **Q3: Why did you deploy the ML backend as a separate Docker container?**
> - **Answer**: *"Next.js serverless functions (like Vercel) have tight execution timeouts and do not support heavy native C++ or Python runtimes like `scikit-learn` or `numpy`. We decoupled the system into a microservices architecture, hosting the Python FastAPI engine inside a Docker container on Render/Railway. This keeps our models isolated, fast, and scalable."*

---

## 🔒 Security Buzzwords to Mention

Make sure to scatter these terms throughout your talking points to show architectural depth:

* **JWT (JSON Web Token)**: Enforces stateless authentication, verifying session signatures cryptographically on the server without storing active session records database-side.
* **IP Rate Limiting**: The server counts incoming requests per client IP address, automatically throttling requests (returning standard HTTP `429 Too Many Requests`) to prevent Denial of Service (DoS) attacks on our LLM APIs.
* **Ordinary Least Squares (OLS) Linear Regression**: The mathematical algorithm used by our trend lines to calculate the slope of spending over time and project future monthly outflow bounds.
* **State Sync Hook**: The React context that bridges the local client state and the MongoDB server actions seamlessly.
