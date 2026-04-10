// client/src/features/incidents/pages/Incidents.tsx
import { useState } from 'react';
import { Activity, Loader2, ListFilter } from 'lucide-react';
import { useAuth } from '../../../core/context/auth';
import { apiClient } from '../../../core/api/client';
import IncidentTable from '../components/IncidentTable';

export default function Incidents() {
    const [refreshKey, setRefreshKey] = useState(0);
    const [isSimulating, setIsSimulating] = useState(false);
    const { activeProject } = useAuth();

    const handleSimulateTraffic = async () => {
        if (!activeProject) return;
        setIsSimulating(true);
        try {
            await apiClient.post(`/projects/${activeProject.id}/simulate`);
            setRefreshKey(prev => prev + 1); 
        } catch (error) {
            console.error("Failed to simulate traffic:", error);
        } finally {
            setIsSimulating(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-100 tracking-tight">Incidents</h2>
                    <p className="text-muted mt-1">Investigate and resolve system alerts.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors bg-surface border border-surfaceBorder px-4 py-2 rounded-lg font-medium">
                        <ListFilter size={16} /> Filter
                    </button>
                    <button onClick={handleSimulateTraffic} disabled={isSimulating || !activeProject} className="flex items-center gap-2 bg-glass border border-primary/50 text-primary hover:bg-primary/10 px-4 py-2 rounded-lg font-medium transition-all shadow-[0_0_15px_rgb(var(--primary)/0.15)] disabled:opacity-50">
                        {isSimulating ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
                        Simulate Traffic
                    </button>
                </div>
            </header>

            <IncidentTable projectId={activeProject?.id} key={refreshKey} />
        </div>
    );
}