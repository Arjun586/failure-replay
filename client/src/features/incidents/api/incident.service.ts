// client/src/api/incident.service.ts
import { apiClient } from '../../../core/api/client';

// Type definition yahan rakhna best hai
export interface Incident {
    id: string;
    title: string;
    status: string;
    severity: string;
    createdAt: string;
}

export interface LogEvent {
    id: string;
    timestamp: string;
    level: string;
    message: string;
    service: string;
    correlationId: string | null;
}

export interface IncidentDetails {
    id: string;
    title: string;
    description: string;
    status: string;
    severity: string;
    events: LogEvent[];
}

// Extend log event types with trace and span metadata
export interface TraceSummary {
    id: string
    traceId: string
    rootService: string | null
    rootOperation: string | null
    status: string | null
    startedAt: string
    endedAt: string | null
}

export interface SpanSummary {
    id: string
    spanId: string
    parentSpanId: string | null
    serviceName: string
    operationName: string
    status: string | null
    errorMessage: string | null
    startTime: string
    endTime: string | null
    durationMs: number | null
}

export interface LogEvent {
    id: string
    timestamp: string
    level: string
    message: string
    service: string
    correlationId: string | null
    traceRefId?: string | null
    spanRefId?: string | null
    trace?: TraceSummary | null
    span?: SpanSummary | null
}


export interface TraceGraphNode {
    id: string
    service: string
    hasError: boolean
    duration: number
}

export interface TraceGraphEdge {
    source: string
    target: string
    calls: number
}

export interface TraceGraph {
    nodes: TraceGraphNode[]
    edges: TraceGraphEdge[]
}


export const incidentService = {
    // Fetch all incidents for a project
    getIncidentsByProject: async (projectId: string): Promise<Incident[]> => {
        const response = await apiClient.get(`/incidents?projectId=${projectId}`);
        return response.data.data;
    },

    // Fetch single incident timeline
    getIncidentTimeline: async (incidentId: string) => {
        const response = await apiClient.get(`/incidents/${incidentId}/timeline`);
        return response.data.data;
    },

    async updateStatus(incidentId: string, status: string) {
    const response = await apiClient.patch(`/incidents/${incidentId}/status`, { status });
    return response.data;
}
};


export const traceService = {
    getTraceGraph: async (traceId: string): Promise<TraceGraph> => {
        const response = await apiClient.get(`/traces/${traceId}/graph`);
        return response.data.data;
    },
    
    // NEW: Fetch the full trace with ordered spans
    getTraceDetails: async (traceId: string) => {
        const response = await apiClient.get(`/traces/${traceId}`);
        return response.data.data;
    }
}