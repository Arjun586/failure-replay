// server/src/controllers/trace.controller.ts
import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { ingestTraceSchema, OTLPTraceExportSchema } from "../validations/trace.schema";
import { ingestTrace } from "../services/trace.service";

// Processes manual trace creation requests after validating input against the ingest schema
export const createTrace = async (req: Request, res: Response): Promise<void> => {
    try {
        const validatedData = ingestTraceSchema.parse(req.body);
        const trace = await ingestTrace(validatedData);

        res.status(201).json({
            success: true,
            data: trace
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                errors: error.issues
            });
            return;
        }

        if (error instanceof Error && error.message === "Project not found") {
            res.status(404).json({
                success: false,
                message: error.message
            });
            return;
        }

        console.error("Error ingesting trace:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Retrieves all distributed traces associated with a specific project ID
export const getProjectTraces = async (req: Request, res: Response): Promise<void> => {
    try {
        const projectId = req.query.projectId;

        if (!projectId || typeof projectId !== "string") {
            res.status(400).json({
                success: false,
                message: "projectId is required"
            });
            return;
        }

        // Queries the database for project-scoped traces including their nested spans
        const traces = await prisma.trace.findMany({
            where: { projectId },
            include: {
                spans: {
                    orderBy: { startTime: "asc" }
                }
            },
            orderBy: { startedAt: "desc" }
        });

        res.status(200).json({
            success: true,
            data: traces
        });
    } catch (error) {
        console.error("Error fetching traces:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Locates a single trace by its internal UUID or external trace ID string
export const getTraceById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { traceId } = req.params;

        // Attempts to find the trace record while populating spans and log events
        const trace = await prisma.trace.findFirst({
            where: {
                OR: [
                    { id: traceId },
                    { traceId: traceId }
                ]
            },
            include: {
                spans: { orderBy: { startTime: "asc" } },
                logEvents: { orderBy: { timestamp: "asc" } }
            }
        });

        if (!trace) {
            res.status(404).json({ success: false, message: "Trace not found" });
            return;
        }

        res.status(200).json({ success: true, data: trace });
    } catch (error) {
        console.error("Error fetching trace by ID:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Generates a service dependency graph by analyzing parent-child relationships in spans
export const getTraceGraph = async (req: Request, res: Response): Promise<void> => {
    try {
        const { traceId } = req.params;

        if (!traceId) {
            res.status(400).json({ success: false, message: "traceId is required" });
            return;
        }

        const trace = await prisma.trace.findFirst({
            where: {
                OR: [
                    { id: traceId },      
                    { traceId: traceId }  
                ]
            },
            include: {
                spans: {
                    orderBy: { startTime: "asc" }
                }
            }
        });

        if (!trace || trace.spans.length === 0) {
            res.status(404).json({
                success: false,
                message: "Trace not found or contains no spans"
            });
            return;
        }

        // Maps service nodes and identifies cross-service request boundaries
        const nodes = new Map<string, { id: string; service: string; hasError: boolean; duration: number }>();
        const edges = new Map<string, { source: string; target: string; calls: number }>();
        const spanServiceMap = new Map<string, string>();
        const serviceTimers = new Map<string, { start: number, end: number }>();

        trace.spans.forEach(span => {
            spanServiceMap.set(span.spanId, span.serviceName);
            
            const start = new Date(span.startTime).getTime();
            const end = span.endTime ? new Date(span.endTime).getTime() : start + (span.durationMs || 0);

            // Reconstructs service-level boundaries for accurate duration calculation
            if (!serviceTimers.has(span.serviceName)) {
                serviceTimers.set(span.serviceName, { start, end });
            } else {
                const timer = serviceTimers.get(span.serviceName)!;
                if (start < timer.start) timer.start = start;
                if (end > timer.end) timer.end = end;
            }

            if (!nodes.has(span.serviceName)) {
                nodes.set(span.serviceName, {
                    id: span.serviceName,
                    service: span.serviceName,
                    hasError: false,
                    duration: 0
                });
            }
            
            const node = nodes.get(span.serviceName)!;
            if (span.status === "ERROR" || span.errorMessage) {
                node.hasError = true;
            }
        });

        // Computes mathematical duration for each service node in the graph
        serviceTimers.forEach((timer, service) => {
            if (nodes.has(service)) {
                nodes.get(service)!.duration = timer.end - timer.start;
            }
        });

        // Constructs directed edges for unique cross-service calls
        trace.spans.forEach(span => {
            if (span.parentSpanId && spanServiceMap.has(span.parentSpanId)) {
                const parentService = spanServiceMap.get(span.parentSpanId)!;
                
                if (parentService !== span.serviceName) {
                    const edgeId = `${parentService}->${span.serviceName}`;
                    
                    if (!edges.has(edgeId)) {
                        edges.set(edgeId, {
                            source: parentService,
                            target: span.serviceName,
                            calls: 0
                        });
                    }
                    
                    edges.get(edgeId)!.calls += 1;
                }
            }
        });

        res.status(200).json({
            success: true,
            data: {
                nodes: Array.from(nodes.values()),
                edges: Array.from(edges.values())
            }
        });
    } catch (error) {
        console.error("Error generating trace graph:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Ingests high-volume OTLP trace payloads and correlates them with existing project data
export const ingestOTLPTraces = async (req: Request, res: Response): Promise<void> => {
    try {
        const projectId = req.headers["x-project-id"] as string;

        if (!projectId) {
            res.status(400).json({ success: false, message: "Missing x-project-id header" });
            return;
        }

        res.status(202).json({ success: true, message: "OTLP Traces accepted for processing" });

        const parsedData = OTLPTraceExportSchema.parse(req.body);
        const spansToInsert: any[] = [];
        const tracesMap = new Map<string, any>();

        // Unpacks nested OTLP structures into a flat map of traces and spans
        for (const resourceSpan of parsedData.resourceSpans) {
            let serviceName = "unknown-service";
            const serviceAttr = resourceSpan.resource?.attributes.find((a: any) => a.key === "service.name");
            
            if (serviceAttr?.value?.stringValue) {
                serviceName = serviceAttr.value.stringValue;
            }

            for (const scopeSpan of resourceSpan.scopeSpans) {
                for (const span of scopeSpan.spans) {
                    const startTime = new Date(Number(BigInt(span.startTimeUnixNano) / BigInt(1000000)));
                    const endTime = new Date(Number(BigInt(span.endTimeUnixNano) / BigInt(1000000)));
                    const durationMs = endTime.getTime() - startTime.getTime();
                    const isError = span.status?.code === 2;

                    // Clusters spans into their parent traces while maintaining root span metadata
                    if (!tracesMap.has(span.traceId)) {
                        tracesMap.set(span.traceId, {
                            traceId: span.traceId,
                            projectId: projectId,
                            rootService: !span.parentSpanId ? serviceName : "unknown",
                            rootOperation: !span.parentSpanId ? span.name : "unknown",
                            status: isError ? "ERROR" : "OK",
                            startedAt: startTime,
                            endedAt: endTime
                        });
                    } else {
                        const existingTrace = tracesMap.get(span.traceId);
                        if (isError) existingTrace.status = "ERROR";
                        if (endTime > existingTrace.endedAt) existingTrace.endedAt = endTime;
                        if (!span.parentSpanId) {
                            existingTrace.rootService = serviceName;
                            existingTrace.rootOperation = span.name;
                            existingTrace.startedAt = startTime;
                        }
                    }

                    spansToInsert.push({
                        traceId: span.traceId,
                        spanId: span.spanId,
                        parentSpanId: span.parentSpanId || null,
                        serviceName: serviceName,
                        operationName: span.name,
                        status: isError ? "ERROR" : "OK",
                        startTime,
                        endTime,
                        durationMs
                    });
                }
            }
        }

        // Performs a bulk upsert of trace metadata followed by child spans
        for (const traceData of Array.from(tracesMap.values())) {
            const savedTrace = await prisma.trace.upsert({
                where: { traceId: traceData.traceId },
                update: { 
                    status: traceData.status, 
                    endedAt: traceData.endedAt,
                    ...(traceData.rootService !== "unknown" && { rootService: traceData.rootService, rootOperation: traceData.rootOperation })
                },
                create: traceData
            });

            const childSpans = spansToInsert.filter(s => s.traceId === traceData.traceId);
            let firstErrorDbSpanId = null;
            let firstErrorService = traceData.rootService;
            let firstErrorOp = traceData.rootOperation;

            for (const span of childSpans) {
                const savedSpan = await prisma.span.upsert({
                    where: { spanId: span.spanId },
                    update: {},
                    create: {
                        traceRefId: savedTrace.id,
                        spanId: span.spanId,
                        parentSpanId: span.parentSpanId,
                        serviceName: span.serviceName,
                        operationName: span.operationName,
                        status: span.status,
                        startTime: span.startTime,
                        endTime: span.endTime,
                        durationMs: span.durationMs
                    }
                });

                if (span.status === 'ERROR' && !firstErrorDbSpanId) {
                    firstErrorDbSpanId = savedSpan.id;
                    firstErrorService = span.serviceName;
                    firstErrorOp = span.operationName;
                }
            }
        }
    } catch (error) {
        console.error("❌ OTLP Ingestion Error:", error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: "Failed to ingest traces" });
        }
    }
};