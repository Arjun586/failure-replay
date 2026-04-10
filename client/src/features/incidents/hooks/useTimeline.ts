// client/src/features/incidents/hooks/useTimeline.ts
import { useState, useEffect, useCallback } from 'react';
import { incidentService, type IncidentDetails, type LogEvent } from '../api/incident.service';
import { apiClient } from '../../../core/api/client';

export function useTimeline(incidentId: string | undefined) {
    const [incident, setIncident] = useState<IncidentDetails | null>(null);
    const [logs, setLogs] = useState<LogEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Initial Fetch (Metadata + First Page of Logs)
    useEffect(() => {
        if (!incidentId) return;
        const fetchInitialData = async () => {
            try {
                setIsLoading(true);
                // 1. Get Incident Metadata
                const metaData = await incidentService.getIncidentTimeline(incidentId);
                setIncident(metaData);

                // 2. Get First Page of Logs
                const logsRes = await apiClient.get(`/incidents/${incidentId}/logs`);
                setLogs(logsRes.data.data);
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

    // Fetch Next Page Function
    const loadMoreLogs = useCallback(async () => {
        if (!nextCursor || isLoadingMore || !incidentId) return;

        try {
            setIsLoadingMore(true);
            const res = await apiClient.get(`/incidents/${incidentId}/logs?cursor=${nextCursor}`);
            
            // Append new logs to existing logs
            setLogs(prev => [...prev, ...res.data.data]);
            setNextCursor(res.data.nextCursor);
        } catch (err) {
            console.error("Failed to load more logs", err);
        } finally {
            setIsLoadingMore(false);
        }
    }, [nextCursor, isLoadingMore, incidentId]);

    return { incident, logs, isLoading, isLoadingMore, hasMore: !!nextCursor, loadMoreLogs, error };
}