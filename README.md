# Failure Replay Platform 🕵️‍♂️

An enterprise-grade developer observability and incident management tool. This platform ingests raw backend logs, API traces, and bug reports, parses the telemetry asynchronously, and reconstructs complex system failures into visual, playable timelines for rapid root-cause analysis (RCA).

## 🚀 The Vision
When a distributed system crashes, engineers waste hours manually grepping through massive, noisy log files. **Failure Replay** automates the evidence-gathering phase. By normalizing telemetry and visualizing the exact sequence of events leading to a failure, teams can "replay" the incident, identify the root cause faster, and auto-generate comprehensive postmortems.

---

## 🏗️ System Architecture

The platform is designed using a decoupled, horizontally scalable architecture to handle heavy I/O operations (like parsing 50MB+ log files) without degrading the user experience.

### 1. Presentation Layer (Client)
A Single Page Application (SPA) designed for complex state management and high-density data visualization.
* **Optimistic UI:** Ensures the dashboard feels instantaneous when navigating between incident timelines.
* **Animated Data Flows:** Utilizes physics-based micro-interactions to render timeline events, reducing cognitive load when scanning hundreds of logs.

### 2. API Gateway (Server)
A stateless REST API acting as the central traffic router.
* **Validation-First:** All incoming payloads and file uploads are strictly validated using schema definition libraries before hitting the database.
* **Decoupled Processing:** The API layer is completely separated from the data processing layer to ensure the Node.js event loop is never blocked by CPU-bound parsing tasks.

### 3. Asynchronous Processing Pipeline (The Core Engine)
The backbone of the application. Log files are not parsed synchronously during the HTTP request.
* **Event Normalization:** Background workers extract timestamps, severity levels, and correlation IDs from raw text/JSON logs.
* **Trace Stitching:** The engine groups disparate log lines by `request_id` to reconstruct the exact path of a failing request across multiple microservices.

### 4. Data & Storage Layer
A hybrid storage approach optimized for both structured relationships and raw file retention.
* **Relational Metadata:** PostgreSQL enforces strict referential integrity between Workspaces, Incidents, and millions of individual Log Events.
* **Object Storage (Upcoming):** Raw `.json` and `.log` files are stored in S3-compatible object storage, keeping the database lightweight and performant.

---

## 🛠️ Tech Stack & Engineering Choices

### Frontend
* **React 18 + TypeScript:** Chosen for robust component composition and type safety across the full stack.
* **Vite:** Replaces Webpack for near-instantaneous Hot Module Replacement (HMR) and optimized production builds.
* **Tailwind CSS v3:** Utility-first CSS framework enforcing a strict, dark-mode-first design system.
* **Framer Motion:** Provides hardware-accelerated, spring-physics animations for the timeline and UI elements.
* **Lucide React:** A clean, consistent icon library optimized for developer tooling.

### Backend
* **Node.js + Express.js:** The industry standard for high-throughput, async I/O APIs.
* **TypeScript:** Ensures end-to-end type safety. API responses perfectly match the interfaces expected by the React client.
* **Zod:** Schema declaration and validation. Rejects malformed requests before they consume server resources.

### Database & ORM
* **PostgreSQL (Hosted on Supabase):** Chosen over NoSQL because incident tracking requires strict relational data (Workspaces → Incidents → Events).
* **Prisma ORM:** Provides type-safe database queries and automated migrations, eliminating raw SQL string errors.

---

## 📍 Current Progress (Save State)
- [x] Defined system architecture and high-level tech stack.
- [x] Initialized Vite React client with Tailwind v3 and Framer Motion.
- [x] Built global layout and animated sidebar (`Sidebar.tsx`).
- [x] Initialized Express/Node.js server with TypeScript compilation.
- [x] Set up Supabase PostgreSQL and synced relational schema via Prisma v5.
- [x] Created `Incident API` with strict Zod validation.
- [x] Built live, auto-refreshing React `IncidentTable.tsx`.
- [x] **New:** Built Multer-powered file upload middleware in Express.
- [x] **New:** Developed Node.js parsing service to dynamically extract errors from raw JSON logs and bulk-insert `LogEvents` into Postgres.
- [x] **New:** Created animated, Drag-and-Drop `FileUploader.tsx` in React using Framer Motion and Axios.
- [x] **New:** Built Express Timeline API endpoint to fetch a parent incident and all associated time-sorted log events.
- [ ] Connect React Router to navigate between Dashboard and Timeline.
- [ ] Build the interactive Replay Timeline UI component.

## 🚀 How to Run Locally

**1. Clone and Install**
```bash
git clone https://github.com/yourusername/failure-replay.git
cd failure-replay
```

**2. Start the Backend API**
```bash
cd server
npm install
# Ensure your .env file contains your DATABASE_URL
npm run dev
```

**3. Start the Frontend UI**
```bash
cd ../client
npm install
npm run dev
```