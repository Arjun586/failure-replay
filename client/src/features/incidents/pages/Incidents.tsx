// client/src/features/incidents/pages/Incidents.tsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, Loader2, ListFilter, Radio } from 'lucide-react';
import { useAuth } from '../../../core/context/auth';
import { apiClient } from '../../../core/api/client';
import IncidentTable from '../components/IncidentTable';
import FilterDrawer from '../components/FilterDrawer';

/**
 * Incidents Page Component
 * The primary view for monitoring, filtering, and managing system alerts.
 * Supports a "Live Feed" mode for real-time updates and traffic simulation for testing.
 */
export default function Incidents() {
    // State to trigger a manual re-fetch of the IncidentTable
    const [refreshKey, setRefreshKey] = useState(0);
    // Tracks the progress of the mock traffic generation request
    const [isSimulating, setIsSimulating] = useState(false);
    // Controls the visibility of the slide-out filter panel
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const { activeProject } = useAuth();
    const [searchParams] = useSearchParams();

    // Persists the Live Feed preference to local storage to maintain state across sessions
    const [isLiveMode, setIsLiveMode] = useState(() => {
        const savedMode = localStorage.getItem('replayos_live_mode');
        return savedMode === 'true';
    });

    /**
     * Effect: Updates local storage whenever the Live Feed state changes.
     */
    useEffect(() => {
        localStorage.setItem('replayos_live_mode', isLiveMode.toString());
    }, [isLiveMode]);

    /**
     * Triggers a backend process to generate synthetic incident data.
     * Useful for demonstrating platform capabilities or testing UI components.
     */
    const handleSimulateTraffic = async () => {
        if (!activeProject) return;
        setIsSimulating(true);

        try {
            // Posts to the simulation endpoint for the current project
            await apiClient.post(`/projects/${activeProject.id}/simulate`);
            // Increments the key to force a re-mount/refresh of the table data
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            console.error("Failed to simulate traffic:", error);
        } finally {
            setIsSimulating(false);
        }
    };

    // Derived count of active filters to provide visual feedback on the filter button
    const activeFilterCount = Array.from(searchParams.keys()).length;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-100 tracking-tight">Incidents</h2>
                    <p className="text-muted mt-1">Investigate and resolve system alerts.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* LIVE FEED TOGGLE: Switches between static snapshots and real-time polling */}
                    <button 
                        onClick={() => setIsLiveMode(!isLiveMode)}
                        className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium transition-all ${
                            isLiveMode 
                                ? 'bg-green-500/10 text-green-400 border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.15)]' 
                                : 'bg-surface border border-surfaceBorder text-gray-300 hover:text-white'
                        }`}
                    >
                        <Radio size={16} className={isLiveMode ? "animate-pulse" : ""} />
                        Live Feed: {isLiveMode ? 'ON' : 'OFF'}
                    </button>

                    {/* FILTER TRIGGER: Opens the FilterDrawer and shows active filter count */}
                    <button 
                        onClick={() => setIsFilterOpen(true)} 
                        className={`flex items-center gap-2 text-sm transition-colors border px-4 py-2 rounded-lg font-medium ${
                            activeFilterCount > 0 
                            ? 'bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgb(var(--primary)/0.2)]' 
                            : 'bg-surface border-surfaceBorder text-gray-300 hover:text-white hover:bg-surfaceBorder/30'
                        }`}
                    >
                        <ListFilter size={16} /> 
                        Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                    </button>

                    {/* TRAFFIC SIMULATOR: Manual trigger for generating sample telemetry */}
                    <button 
                        onClick={handleSimulateTraffic} 
                        disabled={isSimulating || !activeProject} 
                        className="flex items-center gap-2 bg-glass border border-primary/50 text-primary hover:bg-primary/10 px-4 py-2 rounded-lg font-medium transition-all shadow-[0_0_15px_rgb(var(--primary)/0.15)] disabled:opacity-50"
                    >
                        {isSimulating ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
                        Simulate Traffic
                    </button>
                </div>
            </header>

            {/* Slide-out drawer for managing complex search and filter queries */}
            <FilterDrawer isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />

            {/* Main data display layer */}
            <IncidentTable 
                projectId={activeProject?.id} 
                key={refreshKey} 
                isLiveMode={isLiveMode} 
                searchParams={searchParams} 
            />
        </div>
    );
}