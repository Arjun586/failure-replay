// server/src/routes/invitation.routes.ts
import { Router } from 'express';
import { createInvitation, acceptInvitation } from '../controllers/invitation.controller';
import { authenticateUser } from '../middleware/auth.middleware';

// Initializes the Express router for team invitation management
const router = Router();

// Generates a secure invitation token for new team members; requires user authentication
router.post('/', authenticateUser, createInvitation);

// Processes invitation acceptance, account creation, and organization linking
router.post('/accept', acceptInvitation);

// Exports the invitation router for global usage
export default router;