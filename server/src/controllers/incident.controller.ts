// server/src/controllers/incident.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

//Validate incoming data before it touches the database!
const createIncidentSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters long"),
    description: z.string().optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).default('high'),
});

export const createIncident = async (req: Request, res: Response): Promise<void> => {
    try {
        // Zod checks the request body. If it's bad, it throws an error immediately.
        const validatedData = createIncidentSchema.parse(req.body);

        // Find the first workspace, or create a default one if DB is empty
        let workspace = await prisma.workspace.findFirst();
        if (!workspace) {
            workspace = await prisma.workspace.create({
                data: { name: 'Default Team Workspace' }
            });
        }

        // Save the new incident to Supabase
        const incident = await prisma.incident.create({
            data: {
                title: validatedData.title,
                description: validatedData.description,
                severity: validatedData.severity,
                workspaceId: workspace.id,
            },
        });

        // Send a success response back to React
        res.status(201).json({
            success: true,
            data: incident,
        });

    } catch (error) {
        // If Zod validation fails, send a 400 Bad Request
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, errors: error.issues });
            return;
        }
        
        // If Supabase fails, send a 500 Internal Server Error
        console.error("Error creating incident:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getIncidents = async (req: Request, res: Response): Promise<void> => {
    try {
        const incidents = await prisma.incident.findMany({
            orderBy: { createdAt: 'desc' },
            include: { workspace: true } // This also fetches the Workspace name!
        });

        res.status(200).json({
            success: true,
            data: incidents,
        });
    } catch (error) {
        console.error("Error fetching incidents:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


// Fetch a single incident AND all its associated log events, sorted by time
export const getIncidentTimeline = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const incident = await prisma.incident.findUnique({
            where: { id },
            include: {
                events: {
                orderBy: { timestamp: 'asc' } // MUST be ascending so the timeline flows top-to-bottom
                },
                workspace: true
            }
        });

        if (!incident) {
            res.status(404).json({ success: false, message: 'Incident not found' });
            return;
        }

        res.status(200).json({ success: true, data: incident });
    } catch (error) {
        console.error("Error fetching timeline:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};