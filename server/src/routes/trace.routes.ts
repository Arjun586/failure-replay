// server/src/routes/trace.routes.ts
import { Router } from "express";
import { authenticateUser } from "../middleware/auth.middleware";
import { authenticateIngest } from "../middleware/traceIngest.middleware";
import { authorizeProjectAccess } from '../middleware/tenant.middleware';
import { 
    createTrace, 
    getProjectTraces, 
    getTraceById, 
    getTraceGraph,
    ingestOTLPTraces  
} from "../controllers/trace.controller";

// Initializes the Express router for distributed tracing and OTLP ingestion
const router = Router();

// Standard OTLP ingestion endpoint protected by project-specific ingest keys (No Cookie Required)
router.post("/v1/traces", authenticateIngest, ingestOTLPTraces);

// Enforces user session authentication for all dashboard-facing trace routes
router.use(authenticateUser);

// Manually creates a trace record after verifying project-level access
router.post("/", authorizeProjectAccess, createTrace);

// Retrieves all traces associated with a project for dashboard visualization
router.get("/", authorizeProjectAccess, getProjectTraces);

// Generates a service dependency graph based on the spans within a trace
router.get("/:traceId/graph", authenticateUser, getTraceGraph);

// Fetches the full details of a single trace using its internal or external ID
router.get("/:traceId", authenticateUser, getTraceById);

// Exports the configured trace router
export default router;