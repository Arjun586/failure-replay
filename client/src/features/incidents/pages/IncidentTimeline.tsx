// client/src/features/incidents/pages/IncidentTimeline.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertCircle, Info, AlertTriangle, FileTerminal, FileText, Server, ListTree, Activity, Network } from 'lucide-react';
import PostmortemModal from '../components/PostmortemModal';
import { useTimeline } from '../hooks/useTimeline';
import TraceGraph from "../components/TraceGraph";
import SpanWaterfall from '../components/SpanWaterfall';
import { Virtuoso } from 'react-virtuoso';

type ViewMode = 'timeline' | 'waterfall' | 'graph';

export default function IncidentTimeline() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeView, setActiveView] = useState<ViewMode>('timeline');
    
    // Extracted our new pagination variables from the updated hook
    const { incident, logs, isLoading, loadMoreLogs, hasMore, error } = useTimeline(id);

    const getEventStyles = (level: string) => {
        switch (level.toUpperCase()) {
            case 'ERROR': return { color: 'text-red-500', bg: 'bg-red-500/10', icon: <AlertCircle size={16} /> };
            case 'WARNING': return { color: 'text-orange-500', bg: 'bg-orange-500/10', icon: <AlertTriangle size={16} /> };
            default: return { color: 'text-blue-400', bg: 'bg-blue-500/10', icon: <Info size={16} /> };
        }
    };

    if (isLoading) return <div className="p-10 text-center text-muted animate-pulse">Reconstructing incident context...</div>;
    if (error || !incident) return <div className="p-10 text-center text-red-500">{error || "Incident not found."}</div>;

    // Search the paginated logs array for the first available trace ID
    const primaryTraceId = logs.find(e => e.traceRefId)?.traceRefId || logs.find(e => e.correlationId)?.correlationId;

    return (
        <div className="w-full max-w-5xl mx-auto pb-20 px-4">
            {/* 1. Fixed Header Section */}
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted hover:text-gray-200 transition-colors mb-6 group">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
            </button>

            <div className="mb-8 flex justify-between items-start bg-surface border border-surfaceBorder p-6 rounded-2xl shadow-sm">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${getEventStyles(incident.severity === 'critical' ? 'ERROR' : 'WARNING').bg}`}>
                            <FileTerminal size={24} className={getEventStyles(incident.severity === 'critical' ? 'ERROR' : 'WARNING').color} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-100">{incident.title}</h1>
                    </div>
                    <p className="text-muted">{incident.description}</p>
                </div>
                
                <button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-lg flex items-center gap-2">
                    <FileText size={18} /> Generate Post-mortem
                </button>
            </div>

            <PostmortemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} incidentTitle={incident.title} severity={incident.severity} events={logs} />

            {/* 2. The View Switcher Tabs */}
            <div className="flex items-center gap-2 mb-8 bg-surface border border-surfaceBorder p-1.5 rounded-xl w-fit">
                <button onClick={() => setActiveView('timeline')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'timeline' ? 'bg-primary/20 text-primary' : 'text-muted hover:text-gray-200'}`}>
                    <ListTree size={16} /> Log Timeline
                </button>
                {primaryTraceId && (
                    <>
                        <button onClick={() => setActiveView('waterfall')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'waterfall' ? 'bg-primary/20 text-primary' : 'text-muted hover:text-gray-200'}`}>
                            <Activity size={16} /> Trace Waterfall
                        </button>
                        <button onClick={() => setActiveView('graph')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === 'graph' ? 'bg-primary/20 text-primary' : 'text-muted hover:text-gray-200'}`}>
                            <Network size={16} /> Dependency Graph
                        </button>
                    </>
                )}
            </div>

            {/* 3. The Dynamic Content Area */}
            <AnimatePresence mode="wait">
                <motion.div 
                    key={activeView}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeView === 'graph' && primaryTraceId && <TraceGraph traceId={primaryTraceId} />}
                    {activeView === 'waterfall' && primaryTraceId && <SpanWaterfall traceId={primaryTraceId} />}
                    
                    {activeView === 'timeline' && (
                        <div className="relative pl-6 border-l-2 border-surfaceBorder ml-4 h-[600px]">
                            <Virtuoso
                                style={{ height: '100%' }}
                                data={logs}
                                endReached={loadMoreLogs}
                                className="no-scrollbar"
                                components={{
                                    Footer: () => hasMore ? (
                                        <div className="py-4 text-center text-muted text-sm flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            Loading older logs...
                                        </div>
                                    ) : (
                                        <div className="py-4 text-center text-muted text-sm">End of incident logs.</div>
                                    )
                                }}
                                itemContent={(index, event) => {
                                    const styles = getEventStyles(event.level);
                                    return (
                                        <div className="relative bg-surface border border-surfaceBorder rounded-xl p-4 shadow-sm hover:border-surfaceBorder/80 transition-all mb-6">
                                            {/* Timeline Node */}
                                            <div className={`absolute -left-[43px] top-4 w-4 h-4 rounded-full border-4 border-background ${styles.bg} ${styles.color} flex items-center justify-center`}>
                                                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                            </div>

                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${styles.bg} ${styles.color} flex items-center gap-1.5`}>
                                                    {styles.icon} {event.level}
                                                </span>
                                                <span className="text-xs text-muted font-mono bg-background/50 px-2 py-1 rounded">
                                                    {format(new Date(event.timestamp), 'HH:mm:ss.SSS')}
                                                </span>
                                            </div>
                                            
                                            <p className="text-gray-200 text-sm font-mono mt-3 break-words">{event.message}</p>
                                            
                                            {event.service && (
                                                <div className="mt-4 pt-3 border-t border-surfaceBorder/50 flex gap-2">
                                                    <span className="flex items-center gap-1 px-2 py-1 bg-surfaceBorder/30 text-gray-300 rounded text-xs border border-surfaceBorder/50">
                                                        <Server size={12} className="text-muted" /> {event.service}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                }}
                            />
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}