// server/src/middleware/traceIngest.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';

// Authenticates incoming telemetry data using project-specific identification headers
export const authenticateIngest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Extracts project identity and security key from request headers
        const projectId = req.headers['x-project-id'] as string;
        const ingestKey = req.headers['x-ingest-key'] as string;

        // Validates that both required authentication headers are present
        if (!projectId || !ingestKey) {
            res.status(401).json({ 
                success: false, 
                error: "Missing x-project-id or x-ingest-key headers." 
            });
            return;
        }

        // Retrieves the project record to verify its existence and fetch the valid key
        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });

        // Denies access if the provided project ID does not match any record
        if (!project) {
            res.status(401).json({ 
                success: false, 
                error: "Invalid Project ID." 
            });
            return;
        }

        // Converts keys to Buffers to enable constant-time cryptographic comparison
        const providedKey = Buffer.from(ingestKey);
        const actualKey = Buffer.from(project.ingestKey);

        // Prevents timing attacks by using constant-time comparison for the ingest key
        if (providedKey.length !== actualKey.length || !crypto.timingSafeEqual(providedKey, actualKey)) {
            res.status(401).json({ success: false, error: "Invalid Ingest Key." });
            return;
        }

        // Performs a final integrity check of the project and ingest key pairing
        if (!project || project.ingestKey !== ingestKey) {
            res.status(401).json({ 
                success: false, 
                error: "Invalid Project ID or Ingest Key." 
            });
            return;
        }

        // Injects the verified project ID into the request body for downstream processing
        req.body.projectId = projectId;
        
        // Authorizes the request to proceed to the ingestion controller
        next();
    } catch (error) {
        // Handles unexpected server errors during the authentication process
        res.status(500).json({ success: false, error: "Ingest authentication failed." });
    }
};