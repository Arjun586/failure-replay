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

```
┌──────────────┐      1. Upload      ┌──────────────┐      4. 202 Accepted
│ React Client │────────────────────>│ Express API  │<────────────────────┐
└──────────────┘                     └──────┬───────┘                     │
       ^                                    │                             │
       │                                    │ 2. Save File                │
       │                                    V                             │
       │                            ┌──────────────┐              (Non-blocking)
       │                            │  Local Disk  │                      │
       │                            └──────┬───────┘                      │
       │                                   │                              │
       │                                   │ 6. Read/Delete               │
       │                                   V                              │
       │      3. Queue Job          ┌──────────────┐              ┌───────┴──────┐
       └───────────────────────────>│ Redis (Jobs) │<─────────────┤ BullMQ Worker│
                                    └──────────────┘    5. Pull   └───────┬──────┘
                                                                          │
                                                                          │ 7. Bulk Insert
                                                                          V
                                                                  ┌──────────────┐
                                                                  │  PostgreSQL  │
                                                                  └──────────────┘

```

---

## 📍 Current Progress (Save State)

The core architecture and MVP are fully operational, shifting focus toward scaling and advanced observability features. 

- **Core Engine & Architecture:** Built a decoupled stack using a `Vite` `React` client, an `Express`/`Node.js` REST API, and `PostgreSQL` managed by `Prisma ORM`. Heavy log processing is offloaded to `Redis`-backed `BullMQ` background workers to prevent event-loop blocking.
- **Incident Management & UI:** Engineered a dynamic, `Framer Motion`-powered visual timeline for events. Features include drag-and-drop file uploading and a consolidated incident view that seamlessly integrates automated `Markdown` postmortem generation.
- **Security & Multi-Tenancy:** Implemented B2B SaaS multi-tenancy with isolated project scopes. Secured via robust `JWT` authentication (managed through custom frontend service wrappers) and strict backend Role-Based Access Control (`RBAC`).
- **Distributed Tracing (OpenTelemetry):** Supports `OTLP` trace ingestion alongside raw logs. The engine automatically correlates individual log events to their parent request traces across multiple microservices, complete with interactive trace exploration and contextual metadata drawers.
- **Developer Experience (DX):** Shipped a Live Traffic Feed utilizing optimized polling, an interactive onboarding guide, an advanced sidebar command center, and a dedicated `SDK` package for zero-config integration.



---

## 🚀 How to Run Locally

**1. Clone and Install**
```bash
git clone https://github.com/Arjun586/ReplayOS.git
cd ReplayOS
```


**2. Environment Configuration**
To run this project, you will need to add the following environment variables to a .env file located in the /server directory. A template file .env.example is provided in the repository for reference.


```
# Server Configuration
PORT=5000
NODE_ENV=development

# Authentication
# A secret string used to sign secure HttpOnly JWT cookies
JWT_SECRET=your_long_random_secret_string

# Database (PostgreSQL)
# Connection string for your primary PostgreSQL instance
DATABASE_URL="postgresql://user:password@localhost:5432/replayos?schema=public"

# Queue Processing (Redis)
# Required for BullMQ background workers. 
# For Windows, an Upstash (serverless) Redis URL is recommended.
REDIS_URL=rediss://default:your_password@your_endpoint.upstash.io:6379
```
**3. Run Concurrently**
From the root `ReplayOS` folder, run both the API and UI at the same time:
```bash
npm run dev
```


## 🔑 How to get your Database and Redis URLs:
### For PostgreSQL (`DATABASE_URL`): 
Go to [Supabase](https://supabase.com/), create a free project, and navigate to Project Settings > Database. Copy the Connection String (URI) and replace the password placeholder.

### For Redis (REDIS_URL):
Go to [Upstash](https://upstash.com/), create a free Redis database, and scroll down to the "Node.js" or "Connection String" section. Copy the `rediss://...` URL.




## 🗺️ Roadmap & Future Scope

This project is continually evolving from a single-user MVP into a fully-fledged enterprise SaaS product. Here is the exact roadmap for upcoming features and architectural upgrades:


### Phase 5: Enterprise Scalability

- [ ] **S3 Object Storage:** Migrate raw log file storage from the local disk to an S3-compatible cloud bucket (e.g., AWS S3 or Cloudflare R2).
- [ ] **Full-Text Search:** Implement PostgreSQL `tsvector` indexing or Elasticsearch for rapid log querying across millions of events.

### Phase 6: Automated Intelligence
- [ ] **Incident Clustering:** Use error signature hashes (service + route + status) to group similar incoming logs into existing incidents, preventing alert fatigue.
- [ ] **AI-Assisted Root Cause Analysis:** Integrate an LLM (via OpenAI/Anthropic API) to analyze raw log arrays and suggest probable root cause hypotheses inside the postmortem modal.



