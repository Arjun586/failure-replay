// client/src/api/incident.service.ts
import { apiClient } from '../../../core/api/client';

/**
 * Interface Definitions
 * Defines the structured data models for platform incidents, log events, 
 * and distributed tracing metadata.
 */

// Basic incident metadata for list views and dashboards
export interface Incident {
    id: string;
    title: string;
    status: string;
    severity: string;
    createdAt: string;
}

// Minimal log event structure for basic timeline rendering
export interface LogEvent {
    id: string;
    timestamp: string;
    level: string;
    message: string;
    service: string;
    correlationId: string | null;
}

// Detailed incident object including high-level metadata and associated log events
export interface IncidentDetails {
    id: string;
    title: string;
    description: string;
    status: string;
    severity: string;
    events: LogEvent[];
}

// Summary of a distributed trace's root service and overall execution status
export interface TraceSummary {
    id: string;
    traceId: string;
    rootService: string | null;
    rootOperation: string | null;
    status: string | null;
    startedAt: string;
    endedAt: string | null;
}

// Metadata for an individual span within a distributed trace path
export interface SpanSummary {
    id: string;
    spanId: string;
    parentSpanId: string | null;
    serviceName: string;
    operationName: string;
    status: string | null;
    errorMessage: string | null;
    startTime: string;
    endTime: string | null;
    durationMs: number | null;
}

// Enhanced log event interface with optional linkage to tracing and span data
export interface LogEvent {
    id: string;
    timestamp: string;
    level: string;
    message: string;
    service: string;
    correlationId: string | null;
    traceRefId?: string | null;
    spanRefId?: string | null;
    trace?: TraceSummary | null;
    span?: SpanSummary | null;
}

// Node and edge definitions for generating service dependency visualizations
export interface TraceGraphNode {
    id: string;
    service: string;
    hasError: boolean;
    duration: number;
}

export interface TraceGraphEdge {
    source: string;
    target: string;
    calls: number;
}

// Complete graph structure used for mapping cross-service communication
export interface TraceGraph {
    nodes: TraceGraphNode[];
    edges: TraceGraphEdge[];
}

/**
 * Service Objects
 * Provides concrete methods for interacting with incident and trace API endpoints.
 */

export const incidentService = {
    // Retrieves a list of all incidents scoped to a specific project ID
    getIncidentsByProject: async (projectId: string): Promise<Incident[]> => {
        const response = await apiClient.get(`/incidents?projectId=${projectId}`);
        return response.data.data;
    },

    // Fetches the chronological timeline of events associated with an incident
    getIncidentTimeline: async (incidentId: string) => {
        const response = await apiClient.get(`/incidents/${incidentId}/timeline`);
        return response.data.data;
    },

    // Updates the resolution or investigation status of an existing incident
    async updateStatus(incidentId: string, status: string) {
        const response = await apiClient.patch(`/incidents/${incidentId}/status`, { status });
        return response.data;
    }
};

export const traceService = {
    // Generates the service-level dependency graph for a specific trace
    getTraceGraph: async (traceId: string): Promise<TraceGraph> => {
        const response = await apiClient.get(`/traces/${traceId}/graph`);
        return response.data.data;
    },
    
    // Retrieves full trace details including the complete ordered set of spans
    getTraceDetails: async (traceId: string) => {
        const response = await apiClient.get(`/traces/${traceId}`);
        return response.data.data;
    }
};