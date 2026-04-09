// server/src/routes/project.routes.ts
import { Router } from 'express';
import { getProjects, createProject, simulateTraffic } from '../controllers/project.controller';
import { authenticateUser } from '../middleware/auth.middleware';


const router = Router();

router.use(authenticateUser);
router.get('/', getProjects);
router.post('/', createProject);
router.post('/:id/simulate', simulateTraffic);

export default router;