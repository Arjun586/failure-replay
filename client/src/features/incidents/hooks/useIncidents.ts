// client/src/features/incidents/hooks/useIncidents.ts
import { useState, useEffect } from 'react';
import { apiClient } from '../../../core/api/client';

/**
 * Interface Definition
 * Describes the structure of an incident entity as managed by the platform.
 */
interface Incident {
    id: string;
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    status: 'open' | 'in_progress' | 'resolved';
    createdAt: string;
    updatedAt: string;
    projectId: string;
}

/**
 * useIncidents Hook
 * Manages the lifecycle of incident data fetching, including support for 
 * dynamic filtering via URL parameters and real-time polling.
 * * @param projectId - The target project workspace ID.
 * @param searchParams - Optional URL search parameters for filtering results.
 * @param isLiveMode - Toggles periodic background polling for real-time updates.
 */
export function useIncidents(projectId: string | undefined, searchParams?: URLSearchParams, isLiveMode: boolean = false) {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        /**
         * Core fetch logic that synchronizes local state with the backend.
         * @param showLoadingState - If true, triggers the global loading spinner.
         */
        const fetchIncidents = async (showLoadingState = true) => {
            if (!projectId) return;

            try {
                if (showLoadingState) setIsLoading(true);
                setError(null);
          
                // Synchronizes provided search parameters with the required project context
                const params = new URLSearchParams(searchParams?.toString() || '');
                params.set('projectId', projectId); 

                // Executes the GET request with dynamic query parameters for server-side filtering
                const response = await apiClient.get(`/incidents?${params.toString()}`);
                
                // Prevents state updates if the component has been unmounted
                if (isMounted) setIncidents(response.data.data);
            } catch (err) {
                console.error('Failed to fetch incidents:', err);
                if (isMounted) setError('Failed to load incidents');
            } finally {
                // Only hides the loading state if this was an initial or manual fetch
                if (isMounted && showLoadingState) setIsLoading(false);
            }
        };

        // Initial data retrieval
        fetchIncidents(true);

        let intervalId: any;
        /**
         * Live Mode Implementation:
         * Establishes a polling interval to keep the dashboard current.
         * Polling skips the loading spinner to maintain a seamless user experience.
         */
        if (isLiveMode) {
            intervalId = setInterval(() => {
                fetchIncidents(false); 
            }, 5000); // Optimized 5-second polling frequency
        }

        // Cleanup: Terminates polling and prevents memory leaks on unmount or parameter change
        return () => {
            isMounted = false;
            if (intervalId) clearInterval(intervalId);
        };
    }, [projectId, searchParams?.toString(), isLiveMode]);

    return { incidents, isLoading, error };
}