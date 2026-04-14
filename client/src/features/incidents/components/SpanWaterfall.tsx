// client/src/features/incidents/components/SpanWaterfall.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Server, Code, FileSearch, X, Clock, Fingerprint, ActivitySquare, ListTree } from 'lucide-react';
import { format } from 'date-fns';
import { traceService, type SpanSummary } from '../api/incident.service';

interface SpanWaterfallProps {
    traceId: string;
    onViewLogs?: (spanId: string) => void; // Deep link handler
}

export default function SpanWaterfall({ traceId, onViewLogs }: SpanWaterfallProps) {
    const [spans, setSpans] = useState<SpanSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);
    const [traceStart, setTraceStart] = useState<number>(0);
    const [totalDuration, setTotalDuration] = useState<number>(0);
    
    // NEW: State for Slide-over Inspector
    const [selectedSpan, setSelectedSpan] = useState<SpanSummary | null>(null);

    useEffect(() => {
        const fetchTraceDetails = async () => {
            try {
                setIsLoading(true);
                setError(false);
                const data = await traceService.getTraceDetails(traceId);
                
                if (data && data.spans.length > 0) {
                    setSpans(data.spans);
                    const startTimes = data.spans.map((s: SpanSummary) => new Date(s.startTime).getTime());
                    const endTimes = data.spans.map((s: SpanSummary) => 
                        s.endTime ? new Date(s.endTime).getTime() : new Date(s.startTime).getTime() + (s.durationMs || 0)
                    );
                    
                    const minStart = Math.min(...startTimes);
                    const maxEnd = Math.max(...endTimes);
                    
                    setTraceStart(minStart);
                    setTotalDuration(Math.max(maxEnd - minStart, 1)); 
                } else {
                    setError(true);
                }
            } catch (err) {
                setError(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTraceDetails();
    }, [traceId]);

    // Handle scroll lock when inspector is open
    useEffect(() => {
        if (selectedSpan) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "unset";
        return () => { document.body.style.overflow = "unset"; };
    }, [selectedSpan]);

    if (isLoading) return <div className="animate-pulse h-32 bg-surfaceBorder/20 rounded-xl"></div>;
    
    if (error || spans.length === 0) {
        return (
            <div className="p-6 bg-surfaceBorder/10 rounded-xl border border-surfaceBorder text-center">
                <FileSearch className="mx-auto text-muted mb-2 opacity-50" size={24} />
                <p className="text-muted text-sm">Trace data is not available for this correlation ID.</p>
            </div>
        );
    }

    return (
        <div className="w-full bg-surface border border-surfaceBorder rounded-xl overflow-hidden shadow-sm relative">
            <div className="bg-surfaceBorder/30 px-4 py-3 border-b border-surfaceBorder flex items-center justify-between">
                <h3 className="font-bold text-gray-200 flex items-center gap-2">
                    <Code size={18} className="text-primary" /> Trace Waterfall
                </h3>
                <span className="text-xs text-muted font-mono">{totalDuration}ms Total</span>
            </div>
            
            <div className="p-4 space-y-3">
                {spans.map((span, index) => {
                    const start = new Date(span.startTime).getTime();
                    const duration = span.durationMs || 0;
                    const leftOffset = ((start - traceStart) / totalDuration) * 100;
                    const widthPercent = Math.max((duration / totalDuration) * 100, 0.5);
                    const isError = span.status === 'ERROR' || span.errorMessage;
                    const isActive = selectedSpan?.spanId === span.spanId;

                    return (
                        <motion.div 
                            key={span.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => setSelectedSpan(span)}
                            className={`group relative flex flex-col gap-1 text-sm font-mono cursor-pointer rounded-lg p-2 transition-colors border border-transparent ${isActive ? 'bg-primary/5 border-primary/30' : 'hover:bg-surfaceBorder/10 hover:border-surfaceBorder/50'}`}
                        >
                            {/* Metadata Header */}
                            <div className="flex items-center gap-2 text-xs text-muted z-10">
                                <Server size={12} className={isError ? 'text-red-400' : 'text-primary'} />
                                <span className={isError ? 'text-red-400 font-semibold' : 'text-gray-300'}>{span.serviceName}</span>
                                <span className="opacity-50">::</span>
                                <span>{span.operationName}</span>
                                {isError && <AlertCircle size={12} className="text-red-500 ml-auto" />}
                            </div>

                            {/* The Waterfall Bar Container */}
                            {/* The Waterfall Bar Container */}
                            <div className="w-full bg-[#09090b] rounded-md h-5 relative overflow-hidden flex items-center border border-white/5">
                                <motion.div 
                                    
                                    initial={{ width: 0, left: `${leftOffset}%` }}
                                    animate={{ width: `${widthPercent}%`, left: `${leftOffset}%` }}
                                    className={`absolute h-full rounded-md border flex items-center px-2 transition-colors ${
                                        isError 
                                            ? 'bg-red-500/20 border-red-500/50' 
                                            : 'bg-primary/30 border-primary/50 group-hover:bg-primary/40'
                                    }`}
                                >
                                    <span className="text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap drop-shadow-md">
                                        {duration}ms
                                    </span>
                                </motion.div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* 🚀 SLIDE-OVER SPAN INSPECTOR */}
            <AnimatePresence>
                {selectedSpan && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedSpan(null)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100]"
                        />
                        <motion.div 
                            initial={{ x: "100%", boxShadow: "-20px 0 50px rgba(0,0,0,0)" }}
                            animate={{ x: 0, boxShadow: "-20px 0 50px rgba(0,0,0,0.5)" }}
                            exit={{ x: "100%", boxShadow: "-20px 0 50px rgba(0,0,0,0)" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-screen w-full sm:w-[450px] bg-surface border-l border-surfaceBorder z-[110] flex flex-col shadow-2xl"
                        >
                            <div className="flex justify-between items-center p-5 border-b border-surfaceBorder bg-surfaceBorder/20">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                                        <ActivitySquare size={18} className="text-primary"/> Span Metadata
                                    </h2>
                                </div>
                                <button onClick={() => setSelectedSpan(null)} className="p-1.5 text-muted hover:text-white bg-surfaceBorder/30 rounded-lg transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Core Info Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#09090b] p-3 rounded-lg border border-surfaceBorder">
                                        <span className="text-xs text-muted font-medium mb-1 block">Service</span>
                                        <span className="text-sm text-gray-200 font-mono font-bold break-all">{selectedSpan.serviceName}</span>
                                    </div>
                                    <div className="bg-[#09090b] p-3 rounded-lg border border-surfaceBorder">
                                        <span className="text-xs text-muted font-medium mb-1 block">Duration</span>
                                        <span className="text-sm text-gray-200 font-mono font-bold">{selectedSpan.durationMs}ms</span>
                                    </div>
                                    <div className="col-span-2 bg-[#09090b] p-3 rounded-lg border border-surfaceBorder">
                                        <span className="text-xs text-muted font-medium mb-1 block">Operation Name</span>
                                        <span className="text-sm text-gray-200 font-mono truncate">{selectedSpan.operationName}</span>
                                    </div>
                                </div>

                                {/* Precision Timestamps */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2 border-b border-surfaceBorder pb-2">
                                        <Clock size={14} className="text-muted"/> Timing
                                    </h3>
                                    <div className="flex justify-between text-xs font-mono">
                                        <span className="text-muted">Start:</span>
                                        <span className="text-gray-300">{format(new Date(selectedSpan.startTime), 'HH:mm:ss.SSS')}</span>
                                    </div>
                                    {selectedSpan.endTime && (
                                        <div className="flex justify-between text-xs font-mono">
                                            <span className="text-muted">End:</span>
                                            <span className="text-gray-300">{format(new Date(selectedSpan.endTime), 'HH:mm:ss.SSS')}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Identifiers */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2 border-b border-surfaceBorder pb-2">
                                        <Fingerprint size={14} className="text-muted"/> Identifiers
                                    </h3>
                                    <div className="flex flex-col gap-1 text-xs font-mono">
                                        <span className="text-muted">Span ID:</span>
                                        <span className="text-gray-300 bg-surfaceBorder/30 p-1.5 rounded">{selectedSpan.spanId}</span>
                                    </div>
                                    {selectedSpan.parentSpanId && (
                                        <div className="flex flex-col gap-1 text-xs font-mono mt-2">
                                            <span className="text-muted">Parent Span ID:</span>
                                            <span className="text-gray-300 bg-surfaceBorder/30 p-1.5 rounded">{selectedSpan.parentSpanId}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Error Context */}
                                {(selectedSpan.status === 'ERROR' || selectedSpan.errorMessage) && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2 border-b border-red-500/20 pb-2">
                                            <AlertCircle size={14} /> Error Context
                                        </h3>
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm font-mono text-red-300 whitespace-pre-wrap break-words">
                                            {selectedSpan.errorMessage || "Status marked as ERROR with no specific message."}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Deep Link Action */}
                            {onViewLogs && (
                                <div className="p-5 border-t border-surfaceBorder bg-surfaceBorder/10">
                                    <button 
                                        onClick={() => {
                                            setSelectedSpan(null);
                                            onViewLogs(selectedSpan.spanId);
                                        }}
                                        className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-lg"
                                    >
                                        <ListTree size={18} /> View Associated Logs
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}