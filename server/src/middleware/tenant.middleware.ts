// server/src/middleware/tenant.middleware.ts
import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from './auth.middleware';

// Validates that the authenticated user has authorized access to the requested project
export const authorizeProjectAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Retrieves the user ID from the authentication middleware's attached user object
    const userId = req.user?.id;
    
    // Dynamically extracts the project ID from query parameters, request body, or URL path parameters
    const projectId = (req.query.projectId as string) || req.body.projectId || req.params.projectId;

    // Returns a 400 Bad Request if the necessary context identifiers are missing
    if (!projectId || !userId) {
        return res.status(400).json({ success: false, error: "Project context required." });
    }

    try {
        // Queries the database to verify the user belongs to the organization that owns this specific project
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { 
                organization: { 
                    include: { 
                        members: { where: { userId } } 
                    } 
                } 
            }
        });

        // Denies access with a 403 Forbidden if the project does not exist or the user is not a member
        if (!project || project.organization.members.length === 0) {
            return res.status(403).json({ success: false, error: "Unauthorized access to this project." });
        }

        // Passes control to the next middleware or controller if authorization is successful
        next();
    } catch (error) {
        // Handles unexpected database or server errors during the authorization check
        res.status(500).json({ success: false, error: "Authorization check failed." });
    }
};