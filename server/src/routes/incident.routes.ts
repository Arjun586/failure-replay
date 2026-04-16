// server/src/routes/incident.routes.ts
import { Router } from 'express';
import { createIncident, getIncidentLogs, getIncidents, getIncidentTimeline } from '../controllers/incident.controller';
import { authenticateUser } from '../middleware/auth.middleware';
import { updateIncidentStatus } from '../controllers/incident.controller';
import { authorizeProjectAccess } from '../middleware/tenant.middleware';

// Initializes the Express router for incident-related endpoints 
const router = Router();

// Enforces authentication for all subsequent routes using JWT cookies 
router.use(authenticateUser);

// Creates a new incident after verifying project-level access permissions 
router.post('/', authorizeProjectAccess, createIncident);

// Retrieves a list of incidents scoped to a project with multi-factor filtering 
router.get('/', authorizeProjectAccess, getIncidents);

// Fetches the complete metadata and reconstructed timeline for a specific incident
router.get('/:id/timeline', getIncidentTimeline);

// Provides paginated log events associated with a specific incident ID
router.get('/:id/logs', getIncidentLogs);

// Updates the lifecycle status of an incident with built-in RBAC verification
router.patch('/:id/status', updateIncidentStatus);

// Exports the configured router for integration into the main server application 
export default router;