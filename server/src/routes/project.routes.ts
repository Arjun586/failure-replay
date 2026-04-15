// server/src/routes/project.routes.ts
import { Router } from 'express';
import { getProjects, createProject, simulateTraffic, getProjectServices } from '../controllers/project.controller';
import { authenticateUser } from '../middleware/auth.middleware';
import { authorizeProjectAccess } from '../middleware/tenant.middleware';

// Initializes the Express router for project and workspace management
const router = Router();

// Enforces session authentication for all downstream project endpoints
router.use(authenticateUser);

// Retrieves all projects associated with a specific organization
router.get('/', getProjects);

// Creates a new project within an authorized organization
router.post('/', createProject);

// Generates simulated telemetry and mock incidents for a specific project
router.post('/:projectId/simulate', authorizeProjectAccess, simulateTraffic);

// Lists all unique microservices currently sending data to a specific project
router.get('/:projectId/services', authorizeProjectAccess, getProjectServices);

// Exports the project management router
export default router;