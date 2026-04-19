// server/src/controllers/incident.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

// Defines the schema for incident creation, making Project ID a mandatory UUID
const createIncidentSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters long"),
    description: z.string().optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).default('high'),
    projectId: z.string().uuid("Invalid Project ID"), 
});

// Handles the creation of a new incident linked to a specific project
export const createIncident = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validates the request body against the defined Zod schema
        const validatedData = createIncidentSchema.parse(req.body);

        // Verifies the existence of the project in the database before proceeding
        const projectExists = await prisma.project.findUnique({
            where: { id: validatedData.projectId }
        });

        if (!projectExists) {
            res.status(404).json({ success: false, message: "Project not found" });
            return;
        }

        // Persists the incident specifically linked to the provided project ID
        const incident = await prisma.incident.create({
            data: {
                title: validatedData.title,
                description: validatedData.description,
                severity: validatedData.severity,
                projectId: validatedData.projectId, 
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

// Retrieves incidents based on project ID and various optional filters like severity and status
export const getIncidents = async (req: Request, res: Response): Promise<void> => {
    try {
        const projectId = req.query.projectId as string | undefined;
        const severity = req.query.severity as string | undefined;
        const status = req.query.status as string | undefined;
        const search = req.query.search as string | undefined;
        const timeRange = req.query.timeRange as string | undefined;
        const service = req.query.service as string | undefined;

        // Initializes the filter clause with the mandatory project ID
        const whereClause: any = { projectId: projectId };

        // Appends multi-select filters for severity and status if provided
        if (severity) {
            whereClause.severity = { in: severity.split(',') };
        }
        if (status) {
            whereClause.status = { in: status.split(',') };
        }

        // Implements "Deep Search" across incident titles, descriptions, and related logs or traces
        if (search) {
            whereClause.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                {
                    events: {
                        some: {
                            OR: [
                                { message: { contains: search, mode: 'insensitive' } },
                                { correlationId: { contains: search, mode: 'insensitive' } },
                                {
                                    trace: {
                                        traceId: { contains: search, mode: 'insensitive' }
                                    }
                                }
                            ]
                        }
                    }
                }
            ];
        }

        // Filters incidents based on temporal ranges like 15m, 1h, 24h, or 7d
        if (timeRange && typeof timeRange === 'string') {
            const now = new Date();
            let cutoff = new Date();
            
            if (timeRange === '15m') cutoff.setMinutes(now.getMinutes() - 15);
            else if (timeRange === '1h') cutoff.setHours(now.getHours() - 1);
            else if (timeRange === '24h') cutoff.setHours(now.getHours() - 24);
            else if (timeRange === '7d') cutoff.setDate(now.getDate() - 7);
            whereClause.createdAt = { gte: cutoff };
        }

        // Filters by specific microservices involved in the log events
        if (service && typeof service === 'string') {
            whereClause.events = {
                some: { service: { in: service.split(',') } }
            };
        }

        // Executes the query with results ordered by the most recent creation date
        const incidents = await prisma.incident.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
        });

        res.status(200).json({ success: true, data: incidents });
    } catch (error) {
        console.error("Error fetching incidents:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Fetches a detailed incident view including metadata and all associated log events
export const getIncidentTimeline = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        // Extracts the authenticated user's ID from the request object (populated by your auth middleware)
        const userId = (req as any).user.id;

        if (!id || typeof id !== 'string') {
            res.status(400).json({ success: false, message: 'Invalid incident ID format' });
            return;
        }

        // Retrieves incident details including nested traces, spans, and organization membership validation
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
                project: {
                    include: {
                        organization: {
                            // Only returns member records if the authenticated user belongs to this organization
                            include: { members: { where: { userId } } } 
                        }
                    }
                }
            }
        });

        // Rejects access if the incident doesn't exist or the user is not a member of the owning organization
        if (!incident || incident.project?.organization?.members.length === 0) {
            res.status(403).json({ success: false, message: 'Access denied to this incident' });
            return;
        }

        res.status(200).json({ success: true, data: incident });
    } catch (error) {
        console.error("Error fetching timeline:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Retrieves log events for an incident using cursor-based pagination for scalability
export const getIncidentLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { cursor } = req.query;
        const limit = 50;

        if (!id || typeof id !== 'string') {
            res.status(400).json({ success: false, message: 'Invalid incident ID' });
            return;
        }

        // Fetches a limited batch of logs, optionally skipping the cursor item if present
        const logs = await prisma.logEvent.findMany({
            where: { incidentId: id },
            take: limit,
            skip: cursor ? 1 : 0, 
            ...(cursor && { cursor: { id: String(cursor) } }),
            orderBy: { timestamp: "asc" },
            include: {
                trace: true,
                span: true
            }
        });

        // Identifies the ID of the last record to be used as the next pagination cursor
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

// Updates an incident's status while performing RBAC checks at the organization level
export const updateIncidentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const status = req.body.status as string;
        const userId = (req as any).user.id as string;

        // Validates that the new status is among the allowed lifecycle states
        const validStatuses = ['open', 'in_progress', 'resolved', 'ignored'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({ success: false, message: "Invalid status value" });
            return;
        }

        // Retrieves the incident and its associated project to verify ownership
        const incident = await prisma.incident.findUnique({
            where: { id }
        });

        if (!incident) {
            res.status(404).json({ success: false, message: "Incident not found" });
            return;
        }

        const project = await prisma.project.findUnique({
            where: { id: incident.projectId }
        });

        if (!project) {
            res.status(404).json({ success: false, message: "Project not found" });
            return;
        }

        // Conducts a Role-Based Access Control check to ensure the user belongs to the parent organization
        const membership = await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId: userId,
                    organizationId: project.organizationId
                }
            }
        });

        if (!membership) {
            res.status(403).json({ success: false, message: "Unauthorized to update this incident" });
            return;
        }

        // Finalizes the update to the incident's status in the relational database
        const updatedIncident = await prisma.incident.update({
            where: { id },
            data: { status }
        });

        res.status(200).json({ success: true, data: updatedIncident });
    } catch (error) {
        console.error("Error updating incident status:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};