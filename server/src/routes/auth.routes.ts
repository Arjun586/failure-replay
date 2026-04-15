// server/src/routes/auth.routes.ts
import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';

// Initializes the Express router for authentication-related endpoints
const router = Router();

// Handles new user registration, organization setup, and default project creation
router.post('/register', register);

// Authenticates existing users and establishes a secure HttpOnly cookie session
router.post('/login', login);

// Exports the router for integration into the primary server application
export default router;