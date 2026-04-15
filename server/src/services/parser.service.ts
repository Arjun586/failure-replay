// server/src/services/parser.service.ts
import fs from "fs"
import { prisma } from "../lib/prisma"
import { ingestTrace } from "./trace.service" 

// Defines the structure for a single raw log line, including optional distributed tracing metadata
interface RawLog {
    timestamp: string
    level: string
    message: string
    service?: string
    correlationId?: string
    traceData?: { 
        spanId: string;
        parentSpanId?: string | null;
        operationName: string;
        durationMs?: number;
        status?: string;
    }
}

// Logic to identify the most accurate span for a log entry based on service name and temporal overlap
const findBestSpanForLog = async (
    traceRefId: string,
    serviceName: string | undefined,
    timestamp: Date
) => {
    // Returns null if the log doesn't specify which microservice it originated from
    if (!serviceName) {
        return null
    }

    // Queries the database for all spans belonging to the specific trace and service
    const candidateSpans = await prisma.span.findMany({
        where: {
            traceRefId,
            serviceName
        },
        orderBy: {
            startTime: "asc"
        }
    })

    // Returns null if no tracing data exists for this specific microservice in this trace
    if (candidateSpans.length === 0) {
        return null
    }

    // Attempts to find a span where the log timestamp falls exactly between start and end times
    const matchingWindowSpan = candidateSpans.find((span) => {
        if (!span.endTime) {
            return span.startTime <= timestamp
        }

        return span.startTime <= timestamp && span.endTime >= timestamp
    })

    // Returns the exact match if one is found
    if (matchingWindowSpan) {
        return matchingWindowSpan
    }

    // Fallback: If no exact window matches, identifies the span temporally closest to the log event
    let nearestSpan = candidateSpans[0]
    let smallestDistance = Math.abs(candidateSpans[0].startTime.getTime() - timestamp.getTime())

    for (const span of candidateSpans) {
        const distance = Math.abs(span.startTime.getTime() - timestamp.getTime())

        if (distance < smallestDistance) {
            nearestSpan = span
            smallestDistance = distance
        }
    }

    return nearestSpan
}

// Core ingestion pipeline: parses uploaded files, creates incidents, and stitches logs to distributed traces
export const parseLogFile = async (filePath: string, originalName: string, projectId: string) => {
    // Reads the entire file content into memory as a UTF-8 string
    const fileContent = await fs.promises.readFile(filePath, "utf-8");
    // Parses the raw file content into an array of log objects
    const logs: any[] = JSON.parse(fileContent); 

    // Scans the log set once to find the first critical error to define the incident's metadata
    const firstError = logs.find(l => ["ERROR", "CRITICAL"].includes(l.level?.toUpperCase()));
    
    // Creates a parent incident record to group all subsequent log events from this file
    const incident = await prisma.incident.create({
        data: {
            title: firstError ? `Crash: ${firstError.message}` : `Ingest: ${originalName}`,
            severity: firstError ? "critical" : "medium",
            projectId
        }
    });

    // Identifies unique correlation IDs in the log set to perform a single batch query for tracing data
    const uniqueTraces = [...new Set(logs.map(l => l.correlationId).filter(Boolean))];
    
    // Pre-fetches all relevant spans in a single database trip to solve the N+1 lookup problem
    const availableSpans = await prisma.span.findMany({
        where: { trace: { traceId: { in: uniqueTraces }, projectId } },
        select: { id: true, spanId: true, serviceName: true, startTime: true, endTime: true, traceRefId: true }
    });

    // Formats each raw log into a structured database event, linking it to the pre-fetched spans
    const formattedEvents = logs.map(log => {
        const timestamp = new Date(log.timestamp);
        
        // Matches the log to a span in-memory for high-performance correlation
        const matchedSpan = availableSpans.find(s => 
            s.serviceName === log.service && 
            s.startTime <= timestamp && 
            (!s.endTime || s.endTime >= timestamp)
        );

        return {
            incidentId: incident.id,
            timestamp,
            level: log.level,
            message: log.message,
            service: log.service || "unknown",
            correlationId: log.correlationId || null,
            spanRefId: matchedSpan?.id || null
        };
    });

    // Executes a high-speed bulk insert of all events in chunks to respect database parameter limits
    for (let i = 0; i < formattedEvents.length; i += 1000) {
        const chunk = formattedEvents.slice(i, i + 1000);
        await prisma.logEvent.createMany({
            data: chunk
        });
    }

    // Returns the newly created incident metadata to the calling function
    return incident;
};