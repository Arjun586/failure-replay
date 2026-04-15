# ReplayOS Platform 🕵️‍♂️
An advanced, full-stack developer observability and incident management tool built to simplify debugging in modern, distributed architectures. This platform ingests raw backend logs, OpenTelemetry API traces, and bug reports, parsing the heavy telemetry asynchronously to ensure zero impact on your application's performance. By intelligently stitching these data points together, ReplayOS reconstructs complex system failures into visual, playable timelines for rapid root-cause analysis (RCA).

## 🚀 The Vision
When a distributed system or microservice architecture crashes, developers often waste hours manually grepping through massive, noisy log files spread across multiple containers. The sheer volume of data makes it incredibly difficult to track exactly how a single failing request cascaded through the entire sys


## 🏗️ System Architecture

The platform is designed using a decoupled, horizontally scalable architecture to handle heavy I/O operations (like parsing 50MB+ log files) without degrading the user experience.

### 1. Presentation Layer (Client)
A Single Page Application (SPA) designed for complex state management and high-density data visualization.
* **Optimistic UI:** Ensures the dashboard feels instantaneous when navigating between incident timelines.
* **Context-Aware Routing:** Dynamic navigation based on the user's active `Organization` and isolated `Project` scopes.

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
* **Relational Metadata:** PostgreSQL enforces strict referential integrity between Organizations, Projects, Incidents, and millions of individual Log Events.
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
* **PostgreSQL (Hosted on Supabase):** Chosen over NoSQL because incident tracking requires strict relational data (Organization → Projects → Incidents → Events).
* **Prisma ORM:** Provides type-safe database queries and automated migrations, eliminating raw SQL string errors.

---

## 📍 Current Progress (Save State)

### Phase 1: MVP & Core Engine
- [x] Defined system architecture and high-level tech stack.
- [x] Initialized Vite React client with Tailwind v3 and Framer Motion.
- [x] Built global layout and animated sidebar (`Sidebar.tsx`).
- [x] Initialized Express/Node.js server with TypeScript compilation.
- [x] Set up Supabase PostgreSQL and synced relational schema via Prisma v5.
- [x] Created `Incident API` with strict Zod validation.
- [x] Built live, auto-refreshing React `IncidentTable.tsx`.
- [x] Built Multer-powered file upload middleware in Express.
- [x] Developed Node.js parsing service to dynamically extract errors from raw JSON logs and bulk-insert `LogEvents` into Postgres.
- [x] Created animated, Drag-and-Drop `FileUploader.tsx` in React using Framer Motion and Axios.
- [x] Built Express Timeline API endpoint to fetch a parent incident and all associated time-sorted log events.
- [x] Configured React Router v6 to handle deep-linking (`/incident/:id`).
- [x] Built the `IncidentTimeline.tsx` page featuring a staggered, Framer Motion-powered visual event timeline.
- [x] Integrated `@uiw/react-md-editor` and built the `PostmortemModal.tsx` generator to synthesize raw timeline data into a copy-ready Markdown report.

### Phase 2: Security & Multi-Tenancy
- [x] Transitioned to B2B SaaS Multi-Tenant Architecture (`Organization` -> `Projects` -> `Incidents`).
- [x] Implemented secure JWT-based authentication with bcrypt password hashing and global Axios interceptors.
- [x] Built strict Role-Based Access Control (RBAC) middleware for Express.
- [x] Built premium Login, Registration, and React Router `ProtectedRoute` wrappers using Framer Motion.

### Phase 3: Organization Management & Employee Onboarding
- [x] Organization Admin Flow allowing Admins to create and manage isolated Projects via `CreateProjectModal`.
- [x] Context-Aware Navigation with a dynamic Project switcher in the Sidebar, automatically routing users back to the dashboard upon switch.
- [x] Project-Level Isolation ensuring that uploaded log files and fetched incidents are securely scoped to the active project query parameter.
- [x] User Identity UI with active role badges (`ADMIN` / `MEMBER`) and dynamic feature gating (hiding creation tools from non-admins).
- [x] Employee Invitation System with secure backend token generation, UI modals, and one-time link redemption.


### Phase 4: Observability & Distributed Tracing
- [x] **OpenTelemetry Integration:** Ingest standardized OTLP traces alongside raw logs.
- [x] **Trace Correlation:** Automatically map individual log events to their parent request traces across microservices.
- [x] **Service Dependency Graphs:** Visualize which microservice triggered upstream failures.

### Phase 4.5: Developer Experience (DX) & UI Polish 
- [x] **Interactive Onboarding & Setup Guide:** Develop a new SetupGuide.tsx component to provide users with step-by-step integration instructions featuring their unique Ingest URL and Project ID. Provide pre-configured code snippets for Node.js and Python to enable SDK connection in under 2 minutes.
- [x] **Advanced Sidebar Command Center:** Dynamic Project Switcher: A dropdown at the top of the sidebar for seamless navigation between multiple isolated projects.Service Health Overview: A global status indicator to monitor the real-time health (Up/Down) of every connected microservice.
- [x] **Interactive Trace Exploration:** Span Metadata Inspector: A slide-over panel triggered by clicking a span in the Waterfall view to display raw tags, metadata, and high-precision timestamps. Deep Linking (Waterfall to Logs): Automatic page scrolling and highlighting of specific log events when a corresponding span is selected in the trace view.
- [x] **Next-Gen Timeline Observability:** Contextual Metadata Drawer: A sleek slide-out panel that instantly reveals deep OpenTelemetry attributes, raw SQL payloads, and full error stack traces upon clicking a span without cluttering the main UI. Smart Span Collapsing: Automatically detects and groups repetitive N+1 query patterns into single expandable blocks to optimize DOM performance and readability. Critical Path Highlighting: Algorithmically traces and visually highlights the exact sequence of bottlenecks contributing to the highest request latency.
- [x] **Live Traffic Feed:** A "Live Mode" dashboard toggle that utilizes optimized periodic polling to display incoming incidents and traces without requiring a manual refresh.
- [x] **Enhanced Search & Filtering:** Implementation of multi-factor filtering in the IncidentTable.tsx based on Severity (Critical/Warning) and Service Name
- [x] **Visual Polishing:** Global integration of Skeleton Loaders to prevent UI "jumps" and layout shifts during the retrieval of heavy trace and log data
- [x] **Status Editor:** Edit Status of incients
- [x] **Review Theme Toggle:** Reviewing Toggle Theme for bug
- [x] **Udpate Command Center:** Update System Status, When incident resolve change active critcal alerts
- [x] **Fix Upload Logs:** Recheck that manual uploading is working or not
- [x] **Create Package:**: Create a ReplayOS for user to use ReplayOS
- [x] **Update Instrument SDK:** Update instrument SDK for user to connect with ReplayOS withour too much hardship
- [x] **Fix Live Feed**: Keep Live Feed intact even after move to other routes



## 🗺️ Roadmap & Future Scope

This project is continually evolving from a single-user MVP into a fully-fledged enterprise SaaS product. Here is the exact roadmap for upcoming features and architectural upgrades:


### Must Do before Phase 5

- [ ] **Live Working:** Check if All this is working with Live Project


### Phase 5: Enterprise Scalability
- [ ] **Background Workers:** Move the `parseLogFile` service out of the Express request cycle and into a Redis-backed BullMQ worker queue to handle 100MB+ files without blocking the API.
- [ ] **S3 Object Storage:** Migrate raw log file storage from the local disk to an S3-compatible cloud bucket (e.g., AWS S3 or Cloudflare R2).
- [ ] **Full-Text Search:** Implement PostgreSQL `tsvector` indexing or Elasticsearch for rapid log querying across millions of events.

### Phase 6: Automated Intelligence
- [ ] **Incident Clustering:** Use error signature hashes (service + route + status) to group similar incoming logs into existing incidents, preventing alert fatigue.
- [ ] **AI-Assisted Root Cause Analysis:** Integrate an LLM (via OpenAI/Anthropic API) to analyze raw log arrays and suggest probable root cause hypotheses inside the postmortem modal.


---

## 🚀 How to Run Locally

**1. Clone and Install**
```bash
git clone https://github.com/Arjun586/ReplayOS.git
cd ReplayOS
```

**2. Start the Backend API**
```bash
cd server
npm install
# Ensure your .env file contains your DATABASE_URL and JWT_SECRET
```

**3. Start the Frontend UI**
```bash
cd client
npm install
```

**4. Run Concurrently**
From the root `ReplayOS` folder, run both the API and UI at the same time:
```bash
npm run dev
```
