// server/src/controllers/incident.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

// 1. Update Schema: Ab hum ensure kar rahe hain ki projectId request mein aana hi chahiye
const createIncidentSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters long"),
    description: z.string().optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).default('high'),
    projectId: z.string().uuid("Invalid Project ID"), // 👈 NEW: Project ID is mandatory
});

export const createIncident = async (req: Request, res: Response): Promise<void> => {
    try {
        const validatedData = createIncidentSchema.parse(req.body);

        // 2. Verify: Check karo ki ye project database mein sach mein exist karta hai ya nahi
        const projectExists = await prisma.project.findUnique({
            where: { id: validatedData.projectId }
        });

        if (!projectExists) {
            res.status(404).json({ success: false, message: "Project not found" });
            return;
        }

        // 3. Save: Incident ko specifically usi project se link karo
        const incident = await prisma.incident.create({
            data: {
                title: validatedData.title,
                description: validatedData.description,
                severity: validatedData.severity,
                projectId: validatedData.projectId, // 👈 Exact Project ID passed from frontend
            },
        });

        res.status(201).json({
            success: true,
            data: incident,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, errors: error.issues });
            return;
        }
        console.error("Error creating incident:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getIncidents = async (req: Request, res: Response): Promise<void> => {
    // ... (Your existing getIncidents code is completely fine! Keep it as is.)
    try {
        const { projectId } = req.query; 

        if (!projectId || typeof projectId !== 'string') {
            res.status(400).json({ success: false, message: 'projectId is required' });
            return;
        }

        const incidents = await prisma.incident.findMany({
            where: { projectId: projectId },
            orderBy: { createdAt: 'desc' },
        });
        
        res.status(200).json({ success: true, data: incidents });
    } catch (error) {
        console.error("Error fetching incidents:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getIncidentTimeline = async (req: Request, res: Response): Promise<void> => {
    // ... (Your existing getIncidentTimeline code is also fine! Keep it as is.)
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            res.status(400).json({ success: false, message: 'Invalid incident ID format' });
            return;
        }

        const incident = await prisma.incident.findUnique({
            where: { id },
            include: {
                events: {
                    orderBy: { timestamp: "asc" },
                    include: {
                        trace: true,
                        span: true
                    }
                },
                project: true
            }
        })

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


// Add this below your existing getIncidentTimeline function
export const getIncidentLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // Incident ID
        const { cursor } = req.query; // The ID of the last log we fetched
        const limit = 50; // How many logs to fetch per request

        if (!id || typeof id !== 'string') {
            res.status(400).json({ success: false, message: 'Invalid incident ID' });
            return;
        }

        const logs = await prisma.logEvent.findMany({
            where: { incidentId: id },
            take: limit,
            skip: cursor ? 1 : 0, // If we have a cursor, skip the cursor item itself
            ...(cursor && { cursor: { id: String(cursor) } }),
            orderBy: { timestamp: "asc" },
            include: {
                trace: true,
                span: true
            }
        });

        // Determine the next cursor
        const nextCursor = logs.length === limit ? logs[logs.length - 1].id : null;

        res.status(200).json({ 
            success: true, 
            data: logs,
            nextCursor 
        });
    } catch (error) {
        console.error("Error fetching paginated logs:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};