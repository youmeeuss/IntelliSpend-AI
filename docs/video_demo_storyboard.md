# Video Demo Script & Storyboard: IntelliSpend AI
### A Step-by-Step Guide to Recording Your Final Project Video Walkthrough

This document serves as your storyboard and narration script. Open your screen recorder (such as QuickTime, Loom, or OBS), capture the browser at `http://localhost:9002`, and follow the steps below.

---

## ⏱️ Video Summary
* **Target Duration**: 4 to 5 minutes.
* **Recording Tip**: Record your screen while reading the "Voiceover Script" segments out loud in a clear, confident tone.

---

## 🎬 Storyboard Scenes

### Scene 1: Introduction & Dashboard Overview (0:00 - 0:45)
* **What to Show on Screen**: 
  - Start on the main **IntelliSpend AI** Dashboard page (`http://localhost:9002/`).
  - Hover your cursor over the metrics cards (Total Period Outflow, AI Weekly Financial Summary).
* **Action**: Scroll down slightly to show the recent transactions ledger with green/red indicator signs.
* **Voiceover Script**:
  > *"Hello. Today I am demonstrating IntelliSpend AI, a completed personal wealth ledger and financial diagnostics platform. The project is built using Next.js, React, and TypeScript, backed by MongoDB Atlas for storage. Unlike traditional finance trackers, this app leverages state-of-the-art AI Agent Models to audit financial documents, run voice-activated copilot diagnostics, and forecast outflows using Machine Learning regression. On our main dashboard, all metrics are computed dynamically in real-time directly from our database records, with no hardcoded stats."*

---

### Scene 2: AI Receipt Scanner & Insights (0:45 - 1:45)
* **What to Show on Screen**:
  - Click **Receipts** in the sidebar, then click **New Receipt** (or navigate to `/receipts/new`).
  - Select or drag-and-drop a receipt image.
  - Click **Start AI Extraction**.
* **Action**: Watch the vertical laser line scan overlay and show the progressive load steps: *"Scanning receipt..."*, *"Extracting merchant..."*, *"Categorizing expenses..."*, and *"Generating insights..."*.
  - Once extraction completes, point your cursor at the newly added **AI Receipt Insights** panel.
* **Voiceover Script**:
  > *"Next, let's explore our AI Receipt Scanner. When we select a receipt, our custom multimodal AI model extracts the text, vendor, date, line items, and currency. During processing, you see a scanning laser visual filter and progressive loading checkpoints. Once finished, the system calculates advanced AI Receipt Insights: it evaluates our historical ledger to show our top category weight percentage, details if this is a recurring merchant, and triggers an unusual spending warning if the transaction is significantly higher than our average limit. It also flags mathematical anomalies or blurry text."*

---

### Scene 3: AI Voice Assistant & Smart Suggestions (1:45 - 2:30)
* **What to Show on Screen**:
  - Click **AI Assistant** in the sidebar (or navigate to `/assistant`).
  - Hover over the suggestion pills located below the chat input box.
  - Click the pill: **"Where did I spend most?"**.
* **Action**: Watch the query execute instantly, rendering the user message and the AI copilot response in the chat thread.
* **Voiceover Script**:
  > *"Moving to the AI Financial Copilot. Here we have a conversational assistant with text-to-speech feedback and speech recognition dictation. Directly below the chat input, we have integrated three modern quick-suggestion pills. Clicking a suggestion like 'Where did I spend most?' executes immediately. The AI model accesses our active transaction database in its prompt context to yield precise, real-time answers rather than generic advice."*

---

### Scene 4: Financial Market console & UPI simulator (2:30 - 3:15)
* **What to Show on Screen**:
  - Navigate to **Investments** (or `/investments`) and show the Yahoo Finance stock search and Indian Mutual Fund NAV tracking.
  - Navigate to **Wallet** (or `/wallet`) and click **Simulate UPI Pay** on one of the card passes.
* **Action**: Enter a mock UPI PIN (e.g., `123456`) and authorize. Turn on your audio so your recorder captures the transaction success chime.
* **Voiceover Script**:
  > *"Under the Investments and Wallet pages, we have built CORS-safe server integrations to pull live stock prices and search mutual fund NAV listings. In our Wallet Hub, we can flip our pass cards to view secure QR validation codes, or trigger a UPI payment simulator. The simulator validates a secure PIN checkout and synthesizes success chimes directly via native browser AudioContext oscillators, adding the new transaction directly to our ledger."*

---

### Scene 5: Gamification & Currency Scaling (3:15 - 4:00)
* **What to Show on Screen**:
  - Click **Rewards Hub** in the sidebar (or navigate to `/gamification`).
  - Hover over the circular **Financial Fitness Score** gauge.
  - Point out the **Wealth Sentinel** badge.
  - Hover over the **"Needs Review"** text inside the score tier footer, click it, and watch it redirect to `/expenses`.
* **Voiceover Script**:
  > *"On our Gamification and Rewards Hub, our Financial Fitness Score evaluates overall ledger health. The calculations are fully currency-aware: if the user's currency is Indian Rupees, our category thresholds automatically scale to ₹15,000 to prevent unit scale errors. If our score drops below 70, the Score Tier footer activates an interactive 'Needs Review' link. Clicking it redirects us directly to the expenses page so the user can audit their transactions."*

---

### Scene 6: Secure Admin Dashboard (4:00 - 4:45)
* **What to Show on Screen**:
  - Click the pulsating **Admin Controls** shield in the sidebar (or navigate to `/admin`).
  - Scroll through the platform stats, AI Usage charts, and the Audit Trail table showing flagged receipt documents.
* **Voiceover Script**:
  > *"Finally, we have the Admin Analytics Dashboard, restricted solely to users with the administrator role. Admins can audit platform diagnostics: total users, global transaction counts, aggregate category breakdowns, and AI utility triggers. It also displays a Document Audit Trail, highlighting suspicious files that were flagged as blurry or mathematical discrepancies during receipt uploads. If MongoDB is offline, the page automatically switches to local mock metrics to preserve presentation stability."*

---

### Scene 7: Conclusion & Code Safety (4:45 - 5:00)
* **What to Show on Screen**:
  - Switch back to the dashboard or profile settings showing verified security seals.
* **Voiceover Script**:
  > *"To summarize, IntelliSpend AI is a fully secure, responsive, and type-safe financial ecosystem. All TypeScript modules pass typechecks with zero errors, and database security is enforced server-side. Thank you for your time."*
