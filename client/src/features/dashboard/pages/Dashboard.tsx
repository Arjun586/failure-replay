import { useState } from 'react';
import { Activity, Loader2, Code2, UploadCloud } from 'lucide-react'; 
import { useAuth } from '../../../core/context/auth';
import { apiClient } from '../../../core/api/client';
import SetupGuide from '../../projects/components/SetupGuide';
import FileUploader from '../../projects/components/FileUploader';
import IncidentTable from '../../incidents/components/IncidentTable';

export default function Dashboard() {
    const [refreshKey, setRefreshKey] = useState(0);
    const [isSimulating, setIsSimulating] = useState(false);
    const { activeProject } = useAuth();
    const [isSetupOpen, setIsSetupOpen] = useState(false); 
    const [isUploadOpen, setIsUploadOpen] = useState(false);

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
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-100 tracking-tight">Dashboard</h2>
                    <p className="text-muted mt-2">Monitor and investigate system failures in real-time.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsSetupOpen(true)}
                        className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors border border-surfaceBorder hover:border-gray-500 bg-surface px-4 py-2.5 rounded-lg font-medium"
                    >
                        <Code2 size={16} className="text-primary" />
                        Instrument App
                    </button>

                    <button 
                        onClick={() => setIsUploadOpen(!isUploadOpen)}
                        className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors border border-surfaceBorder hover:border-gray-500 bg-surface px-4 py-2.5 rounded-lg font-medium"
                    >
                        <UploadCloud size={16} />
                        Upload
                    </button>

                    <button 
                        onClick={handleSimulateTraffic}
                        disabled={isSimulating || !activeProject}
                        className="flex items-center gap-2 bg-glass border border-primary/50 text-primary hover:bg-primary/10 px-4 py-2.5 rounded-lg font-medium transition-all shadow-[0_0_15px_rgb(var(--primary)/0.15)] disabled:opacity-50"
                    >
                        {isSimulating ? <Loader2 size={18} className="animate-spin" /> : <Activity size={18} />}
                        Simulate Mock Traffic
                    </button>
                </div>
            </header>

            {isSetupOpen && activeProject && (
                <SetupGuide 
                    projectId={activeProject.id} 
                    onClose={() => setIsSetupOpen(false)} 
                />
            )}

            {isUploadOpen && (
                <div className="mb-6">
                    <FileUploader onUploadSuccess={() => {
                        setRefreshKey(prev => prev + 1);
                        setIsUploadOpen(false);
                    }} />
                </div>
            )}

            <div className="mt-4">
                <IncidentTable 
                    projectId={activeProject?.id}
                    key={refreshKey} 
                />
            </div>
        </div>
    );
}