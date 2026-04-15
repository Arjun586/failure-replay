// client/src/features/incidents/pages/IncidentTimeline.tsx
import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertCircle, Info, AlertTriangle, FileTerminal, FileText, Server, ListTree, Activity, Network } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';
import type { VirtuosoHandle } from 'react-virtuoso';

import PostmortemModal from '../components/PostmortemModal';
import { useTimeline } from '../hooks/useTimeline';
import TraceGraph from "../components/TraceGraph";
import SpanWaterfall from '../components/SpanWaterfall';
import StatusDropdown from '../components/StatusDropdown';

type ViewMode = 'timeline' | 'waterfall' | 'graph';

/**
 * IncidentTimeline Component
 * provides a deep-dive view into a specific incident, reconstructing the 
 * failure context through logs, traces, and dependency graphs.
 */
export default function IncidentTimeline() {
    // Retrieves the unique incident ID from the URL path
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    // UI state for modal visibility and switching between visualization modes
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeView, setActiveView] = useState<ViewMode>('timeline');
    
    // Reference for virtualized list control to handle smooth jumping to specific log indices
    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const [highlightedSpanId, setHighlightedSpanId] = useState<string | null>(null);
    
    // Custom hook to manage incident metadata and paginated log retrieval
    const { incident, logs, isLoading, loadMoreLogs, hasMore, error } = useTimeline(id);
    
    // Local state to track status changes before they are synced/refetched from the database
    const [localStatus, setLocalStatus] = useState<string | null>(null);

    // Determines the current incident status, prioritizing local updates over database values
    const currentStatus = localStatus || incident?.status || 'open';

    /**
     * Maps log levels to specific semantic colors and icons for the timeline display.
     */
    const getEventStyles = (level: string) => {
        switch (level.toUpperCase()) {
            case 'ERROR': return { color: 'text-red-500', bg: 'bg-red-500/10', icon: <AlertCircle size={16} /> };
            case 'WARNING': return { color: 'text-orange-500', bg: 'bg-orange-500/10', icon: <AlertTriangle size={16} /> };
            default: return { color: 'text-blue-400', bg: 'bg-blue-500/10', icon: <Info size={16} /> };
        }
    };

    // Global loading and error states for the reconstruction process
    if (isLoading) return <div className="p-10 text-center text-muted animate-pulse">Reconstructing incident context...</div>;
    if (error || !incident) return <div className="p-10 text-center text-red-500">{error || "Incident not found."}</div>;

    // Identifies the primary trace ID to enable deeper visualization modes (Graph/Waterfall)
    const primaryTraceId = logs.find(e => e.traceRefId)?.traceRefId || logs.find(e => e.correlationId)?.correlationId;

    /**
     * Navigation Helper: Scrolls the virtualized timeline to a specific span ID
     * and provides a transient visual highlight.
     */
    const handleJumpToLogs = (spanId: string) => {
        setActiveView('timeline');
        setHighlightedSpanId(spanId);
        const targetIndex = logs.findIndex(log => log.spanRefId === spanId);
        
        setTimeout(() => {
            if (targetIndex !== -1 && virtuosoRef.current) {
                virtuosoRef.current.scrollToIndex({
                    index: targetIndex,
                    align: 'center',
                    behavior: 'smooth'
                });
            }
        }, 200);

        // Clears the highlight after 3 seconds
        setTimeout(() => setHighlightedSpanId(null), 3000);
    };

    return (
        <div className="w-full max-w-5xl mx-auto pb-20 px-4">
            {/* Secondary Navigation */}
            <button onClick={() => navigate('/incidents')} className="flex items-center gap-2 text-muted hover:text-gray-200 transition-colors mb-6 group">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Incidents
            </button>

            {/* HEADER SECTION: Overview, Status Control, and Postmortem trigger */}
            <div className="mb-8 flex justify-between items-start bg-surface border border-surfaceBorder p-6 rounded-2xl shadow-sm">
                <div>
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                        <div className={`p-2 rounded-lg ${getEventStyles(incident.severity === 'critical' ? 'ERROR' : 'WARNING').bg}`}>
                            <FileTerminal size={24} className={getEventStyles(incident.severity === 'critical' ? 'ERROR' : 'WARNING').color} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-100">{incident.title}</h1>
                        
                        <div className="ml-2">
                            <StatusDropdown 
                                incidentId={incident.id} 
                                currentStatus={currentStatus} 
                                onStatusUpdate={setLocalStatus} 
                            />
                        </div>
                    </div>
                    <p className="text-muted">{incident.description}</p>
                </div>
                
                <button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-lg flex items-center gap-2 shrink-0">
                    <FileText size={18} /> Generate Post-mortem
                </button>
            </div>

            {/* Modal for generating and editing incident reports */}
            <PostmortemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} incidentTitle={incident.title} severity={incident.severity} events={logs} />

            {/* VIEW SWITCHER: Toggle between Log Timeline, Waterfall, and Graph modes */}
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

            {/* MAIN CONTENT AREA: Rendered based on selected activeView */}
            <AnimatePresence mode="wait">
                <motion.div 
                    key={activeView}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                >
                    {activeView === 'graph' && primaryTraceId && <TraceGraph traceId={primaryTraceId} onViewLogs={handleJumpToLogs} />}
                    {activeView === 'waterfall' && primaryTraceId && <SpanWaterfall traceId={primaryTraceId} onViewLogs={handleJumpToLogs} />}
                    
                    {activeView === 'timeline' && (
                        <div className="relative pl-6 border-l-2 border-surfaceBorder ml-4 h-[600px]">
                            {/* VIRTUOSO: High-performance virtualized list for massive log datasets */}
                            <Virtuoso
                                ref={virtuosoRef}
                                style={{ height: '100%' }}
                                className="no-scrollbar"
                                data={logs}
                                endReached={loadMoreLogs}
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
                                    const isHighlighted = highlightedSpanId !== null && event.spanRefId === highlightedSpanId;
                                    
                                    return (
                                        <div className={`relative bg-surface border rounded-xl p-4 transition-all duration-500 mb-6 
                                            ${isHighlighted ? 'border-primary shadow-[0_0_20px_rgba(139,92,246,0.25)] scale-[1.02] z-10' 
                                            : 'border-surfaceBorder shadow-sm hover:border-surfaceBorder/80'}
                                        `}>
                                            {/* Status Dot */}
                                            <div className={`absolute -left-[43px] top-4 w-4 h-4 rounded-full border-4 border-background ${styles.bg} ${styles.color} flex items-center justify-center`}>
                                                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                            </div>

                                            {/* Metadata: Level and Timestamp */}
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${styles.bg} ${styles.color} flex items-center gap-1.5`}>
                                                    {styles.icon} {event.level}
                                                </span>
                                                <span className="text-xs text-muted font-mono bg-background/50 px-2 py-1 rounded">
                                                    {format(new Date(event.timestamp), 'HH:mm:ss.SSS')}
                                                </span>
                                            </div>
                                            
                                            {/* Log Content */}
                                            <p className="text-gray-200 text-sm font-mono mt-3 break-words">{event.message}</p>
                                            
                                            {/* Service Attribute Display */}
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