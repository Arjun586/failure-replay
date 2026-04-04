// server/src/routes/incident.routes.ts
import { Router } from 'express';
import { createIncident, getIncidents, getIncidentTimeline } from '../controllers/incident.controller';

const router = Router();

// When someone sends a POST request to this route, run the controller function
router.post('/', createIncident);
router.get('/', getIncidents);
router.get('/:id/timeline', getIncidentTimeline);

export default router;