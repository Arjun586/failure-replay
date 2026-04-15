// client/src/features/incidents/hooks/useTimeline.ts
import { useState, useEffect, useCallback } from 'react';
import { incidentService, type IncidentDetails, type LogEvent } from '../api/incident.service';
import { apiClient } from '../../../core/api/client';

/**
 * useTimeline Hook
 * Manages the data state for a specific incident's chronological timeline.
 * Handles the initial fetch of incident metadata and implements cursor-based 
 * pagination for traversing large volumes of log data.
 * * @param incidentId - The unique identifier of the incident to monitor.
 */
export function useTimeline(incidentId: string | undefined) {
    // State for high-level incident metadata (title, severity, etc.)
    const [incident, setIncident] = useState<IncidentDetails | null>(null);
    
    // State for the paginated collection of log events
    const [logs, setLogs] = useState<LogEvent[]>([]);
    
    // Loading states for initial data acquisition and pagination requests
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    
    // Tracks the pointer for the next set of results in the backend database
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    /**
     * Effect: Initial Fetch
     * Orchestrates the retrieval of incident metadata and the first page of logs
     * whenever the incidentId changes.
     */
    useEffect(() => {
        if (!incidentId) return;

        const fetchInitialData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // 1. Concurrent retrieval of incident metadata
                const metaData = await incidentService.getIncidentTimeline(incidentId);
                setIncident(metaData);

                // 2. Fetching the primary page of log telemetry
                const logsRes = await apiClient.get(`/incidents/${incidentId}/logs`);
                setLogs(logsRes.data.data);
                
                // Updates the cursor for subsequent pagination requests
                setNextCursor(logsRes.data.nextCursor);
            } catch (err) {
                console.error("Timeline fetch error:", err);
                setError("Failed to load incident details");
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, [incidentId]);

    /**
     * loadMoreLogs Function
     * Fetches the next segment of logs using a cursor-based pagination strategy.
     * Appends newly retrieved logs to the existing dataset to build an infinite timeline.
     */
    const loadMoreLogs = useCallback(async () => {
        // Prevents redundant requests if no more data exists or a fetch is in progress
        if (!nextCursor || isLoadingMore || !incidentId) return;

        try {
            setIsLoadingMore(true);
            
            // Requests the next batch using the stored cursor
            const res = await apiClient.get(`/incidents/${incidentId}/logs?cursor=${nextCursor}`);
            
            // Performs an immutable update to append new logs to the existing list
            setLogs(prev => [...prev, ...res.data.data]);
            
            // Updates cursor state with the new pointer provided by the API
            setNextCursor(res.data.nextCursor);
        } catch (err) {
            console.error("Failed to load more logs", err);
        } finally {
            setIsLoadingMore(false);
        }
    }, [nextCursor, isLoadingMore, incidentId]);

    return { 
        incident, 
        logs, 
        isLoading, 
        isLoadingMore, 
        hasMore: !!nextCursor, 
        loadMoreLogs, 
        error 
    };
}