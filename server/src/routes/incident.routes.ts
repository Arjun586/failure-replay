// server/src/routes/incident.routes.ts
import { Router } from 'express';
import { createIncident, getIncidentLogs, getIncidents, getIncidentTimeline } from '../controllers/incident.controller';
import { authenticateUser } from '../middleware/auth.middleware';
import { updateIncidentStatus } from '../controllers/incident.controller';
import { authorizeProjectAccess } from '../middleware/tenant.middleware';

// Initializes the Express router for incident-related endpoints [cite: 1586]
const router = Router();

// Enforces authentication for all subsequent routes using JWT cookies [cite: 1587]
router.use(authenticateUser);

// Creates a new incident after verifying project-level access permissions [cite: 1587]
router.post('/', authorizeProjectAccess, createIncident);

// Retrieves a list of incidents scoped to a project with multi-factor filtering [cite: 1587]
router.get('/', authorizeProjectAccess, getIncidents);

// Fetches the complete metadata and reconstructed timeline for a specific incident [cite: 1588]
router.get('/:id/timeline', getIncidentTimeline);

// Provides paginated log events associated with a specific incident ID [cite: 1588]
router.get('/:id/logs', getIncidentLogs);

// Updates the lifecycle status of an incident with built-in RBAC verification [cite: 1588]
router.patch('/:id/status', updateIncidentStatus);

// Exports the configured router for integration into the main server application [cite: 1588]
export default router;