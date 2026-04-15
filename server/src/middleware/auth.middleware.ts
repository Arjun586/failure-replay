// server/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extends the Express Request interface to include the authenticated user's metadata
export interface AuthRequest extends Request {
    user?: { id: string; email: string };
}

// Retrieves the secret key for verifying JSON Web Tokens from environment variables
const JWT_SECRET = process.env.JWT_SECRET as string;

// Middleware to authenticate users by verifying the JWT stored in HttpOnly cookies
export const authenticateUser = (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Extracts the token from the request cookies populated by cookie-parser
    const token = req.cookies?.jwt_token;

    // Terminates the request with a 401 Unauthorized status if no token is found
    if (!token) {
        res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
        return;
    }

    try {
        // Verifies the token's integrity and decodes the user payload
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
        
        // Attaches the verified user information to the request object for downstream usage
        req.user = decoded;
        
        // Proceeds to the next middleware or route controller in the stack
        next();
    } catch (error) {
        // Clears the corrupted or expired cookie and denies access
        res.clearCookie('jwt_token');
        res.status(401).json({ success: false, error: 'Invalid or expired token.' });
    }
};