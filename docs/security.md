# Security Architecture Review: IntelliSpend AI

This document provides a comprehensive breakdown of the core **security protocols** implemented in **IntelliSpend AI** to secure data persistence, network communications, and user transactions. 

---

## 🔒 1. Cryptographic Password Hashing

* **Mechanism**: IntelliSpend AI integrates with **Firebase Authentication** for identity management. In a production environment, Firebase Auth offloads account credentials and passwords to Google's secure authentication server architecture.
* **Algorithm**: Passwords are secure-hashed server-side on Google Cloud using a customized, modified version of **scrypt** combined with cryptographic salts.
* **Vulnerability Mitigation**: Ensures that even in the case of a client breach, raw passwords are never stored in plain-text or exposed inside the application databases (MongoDB Atlas or local client storage).

---

## 🔑 2. JSON Web Tokens (JWT) Session Verification

* **Authentication Protocol**: Session authorization is stateless and relies on cryptographically signed **JSON Web Tokens (JWT)** (specifically Firebase ID Tokens).
* **Validation Flow**:
  1. Upon successful login, the Firebase Auth client retrieves a signed JWT.
  2. The JWT is transmitted in request authorization headers.
  3. Next.js Server Actions and Google Firestore verify the cryptographic signature against Google's public keys.
* **Security Properties**: Contains a cryptographically verified payload (UID, email, display name, issue time, and expiration timestamp). Rejects expired or tampered tokens, preventing session hijacking.

---

## 🛡️ 3. Input Sanitization & NoSQL Injection Prevention

* **Immunity to SQL Injection**: By deploying a document-based NoSQL architecture (MongoDB Atlas) instead of traditional SQL engines, the application is immune to standard SQL string injections (e.g. `' OR '1'='1`).
* **NoSQL Query Injection Prevention**:
  - Attackers can exploit NoSQL query parameters by passing query operators (like `{ "$gt": "" }`) to bypass filters or extract unauthorized documents.
  - **Mitigation**: Implemented strict parameters casting inside [db.ts](file:///Users/sujitha/Raseed-AI/src/app/actions/db.ts). All inputs (`uid`, transaction `id`, receipt `id`) are sanitized using a string conversion helper (`sanitizeString`) to prevent query objects from executing in MongoDB filters.
  - Destructured database documents explicitly (e.g., mapping properties rather than passing raw JSON objects) to prevent parameter pollution.

---

## ⏱️ 4. In-Memory API Rate Limiting

* **Context**: Machine learning inference tasks (like Linear Regression and category vector analysis) are computationally expensive and vulnerable to denial-of-service (DDoS) script abuse.
* **Mitigation**: Implemented an in-memory sliding-window **IP Rate Limiter** inside [predict.ts](file:///Users/sujitha/Raseed-AI/src/app/actions/predict.ts):
  - Inspects client headers (`x-forwarded-for` or `x-real-ip`) to identify clients uniquely.
  - Limits execution to a maximum of **15 requests per minute** per client.
  - Rejects excess requests with status `error` and returns a rate limit message displayed gracefully via toast notifications.

---

## 🛡️ 5. Cross-Site Scripting (XSS) Prevention

* **React Native Escaping**: Next.js utilizes React’s state rendering engine, which automatically escapes all text inside JSX bindings `{}`. It prevents injected `<script>` tags from executing inside HTML document nodes.
* **Markdown Sanitization**: Dynamic AI investment summaries are parsed using `react-markdown`. We enforce strict Markdown-only syntax (without custom HTML execution triggers like `rehype-raw`), which isolates the renderer from script injection vectors.
* **String Filters**: Explicit string sanitization filters out raw tag delimiters `<` and `>` from transaction descriptions and chat log uploads inside [db.ts](file:///Users/sujitha/Raseed-AI/src/app/actions/db.ts).

---

## 🌐 6. HTTPS Transit Encryption

* **Protocol**: Live cloud endpoints hosted on Vercel (frontend) and Render/Railway (python FastAPI backend) enforce **SSL/TLS (HTTPS)** connections by default.
* **Certificate Management**: Leverages automatic Let's Encrypt CA certificate generation to rotate keys frequently.
* **Security Properties**: All user transactions, uploaded receipts, credit card metadata, and AI queries are encrypted in-transit using AES-256 GCM algorithms, neutralizing Man-in-the-Middle (MITM) sniffing.
