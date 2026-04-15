// client/src/features/dashboard/pages/Dashboard.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck, AlertTriangle, Code2, UploadCloud, Terminal, Clock } from 'lucide-react';
import { useAuth } from '../../../core/context/auth';
import { useIncidents } from '../../incidents/hooks/useIncidents';
import SetupGuide from '../../projects/components/SetupGuide';
import FileUploader from '../../projects/components/FileUploader';

/**
 * Dashboard Component
 * * Serves as the primary 'Command Center' for ReplayOS, providing real-time 
 * metrics and quick actions for the currently active project.
 */
export default function Dashboard() {
    // Accesses the globally active project context
    const { activeProject } = useAuth();
    
    // Custom hook to fetch and manage incident data for the specific project
    const { incidents } = useIncidents(activeProject?.id);

    // Local state to toggle visibility of modal/setup components
    const [isSetupOpen, setIsSetupOpen] = useState(false);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    // Logic to calculate system-wide health metrics based on current incident state
    const criticalCount = incidents.filter(i => i.severity === 'critical' && i.status !== 'resolved').length;
    const resolvedCount = incidents.filter(i => i.status === 'resolved').length;
    const inProgressCount = incidents.filter(i => i.status === 'in_progress').length;
    
    // System health is determined by the absence of unresolved critical incidents
    const systemHealthy = criticalCount === 0;

    // Animation variants for Framer Motion to handle stagger and entry transitions
    const containerVars = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVars = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header Section: Branding and Primary Action Buttons */}
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-100 tracking-tight">Command Center</h2>
                    <p className="text-muted mt-2">
                        Real-time overview for {activeProject?.name || 'your workspace'}.
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* Toggles the log file uploader visibility */}
                    <button 
                        onClick={() => setIsUploadOpen(!isUploadOpen)} 
                        className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors border border-surfaceBorder hover:border-gray-500 bg-surface px-4 py-2 rounded-lg font-medium"
                    >
                        <UploadCloud size={16} /> Upload Logs
                    </button>

                    {/* Opens the SDK instrumentation guide */}
                    <button 
                        onClick={() => setIsSetupOpen(true)} 
                        className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-all shadow-[0_0_15px_rgb(var(--primary)/0.3)]"
                    >
                        <Code2 size={16} /> Instrument SDK
                    </button>
                </div>
            </header>

            {/* Conditionally rendered Setup and Upload modules */}
            {isSetupOpen && activeProject && (
                <SetupGuide projectId={activeProject.id} onClose={() => setIsSetupOpen(false)} />
            )}
            
            {isUploadOpen && (
                <div className="mb-6">
                    <FileUploader onUploadSuccess={() => setIsUploadOpen(false)} />
                </div>
            )}

            {/* Metrics Grid: Visual cards representing different KPIs */}
            <motion.div 
                variants={containerVars} 
                initial="hidden" 
                animate="show" 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {/* System Health Status Card */}
                <motion.div variants={itemVars} className="bg-surface border border-surfaceBorder rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-xl ${systemHealthy ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                            {systemHealthy ? <ShieldCheck size={24} /> : <AlertTriangle size={24} />}
                        </div>
                        <div>
                            <h3 className="text-muted text-sm font-medium">System Status</h3>
                            <p className={`text-xl font-bold ${systemHealthy ? 'text-green-400' : 'text-red-400'}`}>
                                {systemHealthy ? 'Healthy' : 'Degraded'}
                            </p>
                        </div>
                    </div>
                    {/* Status indicator with animated ping effect */}
                    {systemHealthy ? (
                        <div className="flex items-center gap-2 text-sm text-muted mt-4">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span> 
                            All services operational.
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-sm text-red-400 mt-4">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span> 
                            {criticalCount} critical alerts active.
                        </div>
                    )}
                </motion.div>

                {/* Total Incidents Counter */}
                <motion.div variants={itemVars} className="bg-surface border border-surfaceBorder rounded-2xl p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-xl bg-blue-500/20 text-blue-500">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h3 className="text-muted text-sm font-medium">Total Tracked</h3>
                            <p className="text-2xl font-bold text-gray-100">{incidents.length}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Active Investigations (In Progress) Counter */}
                <motion.div variants={itemVars} className="bg-surface border border-surfaceBorder rounded-2xl p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-xl bg-yellow-500/20 text-yellow-500">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h3 className="text-muted text-sm font-medium">In Progress</h3>
                            <p className="text-2xl font-bold text-gray-100">{inProgressCount}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Resolved Issues Counter */}
                <motion.div variants={itemVars} className="bg-surface border border-surfaceBorder rounded-2xl p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-xl bg-purple-500/20 text-purple-500">
                            <Terminal size={24} />
                        </div>
                        <div>
                            <h3 className="text-muted text-sm font-medium">Resolved</h3>
                            <p className="text-2xl font-bold text-gray-100">{resolvedCount}</p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}