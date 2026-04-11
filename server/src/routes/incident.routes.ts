// server/src/routes/incident.routes.ts
import { Router } from 'express';
import { createIncident, getIncidentLogs, getIncidents, getIncidentTimeline } from '../controllers/incident.controller';
import { authenticateUser } from '../middleware/auth.middleware';
import { updateIncidentStatus } from '../controllers/incident.controller';

const router = Router();

router.use(authenticateUser);

// When someone sends a POST request to this route, run the controller function
router.post('/', createIncident);
router.get('/', getIncidents);
router.get('/:id/timeline', getIncidentTimeline);
router.get('/:id/logs', getIncidentLogs);
router.patch('/:id/status', updateIncidentStatus)

export default router;