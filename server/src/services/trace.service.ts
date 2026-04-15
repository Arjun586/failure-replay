// server/src/services/trace.service.ts
import { prisma } from "../lib/prisma"
import type { IngestTraceInput } from "../validations/trace.schema"

// Manages the persistence of distributed traces and their associated spans in the database
export const ingestTrace = async (payload: IngestTraceInput) => {
    // Verifies that the target project exists before attempting to link a new trace
    const projectExists = await prisma.project.findUnique({
        where: { id: payload.projectId }
    })

    if (!projectExists) {
        throw new Error("Project not found")
    }

    // Upserts the trace record to either update an existing request path or create a new one
    const trace = await prisma.trace.upsert({
        where: { traceId: payload.traceId },
        update: {
            rootService: payload.rootService,
            rootOperation: payload.rootOperation,
            status: payload.status,
            startedAt: payload.startedAt,
            endedAt: payload.endedAt ?? null
        },
        create: {
            traceId: payload.traceId,
            projectId: payload.projectId,
            rootService: payload.rootService,
            rootOperation: payload.rootOperation,
            status: payload.status,
            startedAt: payload.startedAt,
            endedAt: payload.endedAt ?? null
        }
    })

    // Removes stale spans for the trace ID to ensure the reconstructed timeline is accurate
    await prisma.span.deleteMany({
        where: { traceRefId: trace.id }
    })

    // Performs a bulk insert of all spans in the payload to build the request hierarchy
    await prisma.span.createMany({
        data: payload.spans.map((span) => ({
            spanId: span.spanId,
            parentSpanId: span.parentSpanId ?? null,
            traceRefId: trace.id,
            serviceName: span.serviceName,
            operationName: span.operationName,
            status: span.status ?? null,
            errorMessage: span.errorMessage ?? null,
            startTime: span.startTime,
            endTime: span.endTime ?? null,
            // Calculates the duration in milliseconds if both start and end times are available
            durationMs: span.endTime
                ? Math.max(0, new Date(span.endTime).getTime() - new Date(span.startTime).getTime())
                : null
        }))
    })

    // Returns the fully populated trace object including its newly created spans
    return prisma.trace.findUnique({
        where: { id: trace.id },
        include: { spans: true }
    })
}