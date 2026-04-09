import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {  AlertCircle, Server, Code } from 'lucide-react';
import { traceService, type SpanSummary } from '../api/incident.service';

interface SpanWaterfallProps {
    traceId: string;
}

export default function SpanWaterfall({ traceId }: SpanWaterfallProps) {
    const [spans, setSpans] = useState<SpanSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [traceStart, setTraceStart] = useState<number>(0);
    const [totalDuration, setTotalDuration] = useState<number>(0);

    useEffect(() => {
        const fetchTraceDetails = async () => {
            try {
                setIsLoading(true);
                const data = await traceService.getTraceDetails(traceId);
                
                if (data && data.spans.length > 0) {
                    setSpans(data.spans);
                    
                    // Calculate Waterfall Boundaries
                    const startTimes = data.spans.map((s: SpanSummary) => new Date(s.startTime).getTime());
                    const endTimes = data.spans.map((s: SpanSummary) => 
                        s.endTime ? new Date(s.endTime).getTime() : new Date(s.startTime).getTime() + (s.durationMs || 0)
                    );
                    
                    const minStart = Math.min(...startTimes);
                    const maxEnd = Math.max(...endTimes);
                    
                    setTraceStart(minStart);
                    setTotalDuration(Math.max(maxEnd - minStart, 1)); // Prevent division by zero
                }
            } catch (err) {
                console.error("Failed to fetch trace details", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTraceDetails();
    }, [traceId]);

    if (isLoading) return <div className="animate-pulse h-32 bg-surfaceBorder/20 rounded-xl"></div>;
    if (spans.length === 0) return null;

    return (
        <div className="w-full bg-surface border border-surfaceBorder rounded-xl overflow-hidden shadow-sm">
            <div className="bg-surfaceBorder/30 px-4 py-3 border-b border-surfaceBorder flex items-center justify-between">
                <h3 className="font-bold text-gray-200 flex items-center gap-2">
                    <Code size={18} className="text-primary" /> Trace Waterfall
                </h3>
                <span className="text-xs text-muted font-mono">{totalDuration}ms Total</span>
            </div>
            
            <div className="p-4 space-y-2">
                {spans.map((span, index) => {
                    const start = new Date(span.startTime).getTime();
                    const duration = span.durationMs || 0;
                    
                    // Calculate CSS Percentages for the Waterfall layout
                    const leftOffset = ((start - traceStart) / totalDuration) * 100;
                    const widthPercent = Math.max((duration / totalDuration) * 100, 0.5); // Give min width of 0.5% so very fast spans are visible
                    
                    const isError = span.status === 'ERROR' || span.errorMessage;

                    return (
                        <motion.div 
                            key={span.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group relative flex flex-col gap-1 text-sm font-mono"
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
                            <div className="w-full bg-background rounded-md h-6 relative overflow-hidden flex items-center">
                                {/* The Actual Duration Bar */}
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${widthPercent}%` }}
                                    className={`absolute h-full rounded-md border flex items-center px-2 transition-colors ${
                                        isError 
                                        ? 'bg-red-500/20 border-red-500/50' 
                                        : 'bg-primary/20 border-primary/50 group-hover:bg-primary/30'
                                    }`}
                                    style={{ left: `${leftOffset}%` }}
                                >
                                    <span className="text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap drop-shadow-md">
                                        {duration}ms
                                    </span>
                                </motion.div>
                            </div>
                            
                            {/* Error Message Tooltip/Expansion */}
                            {isError && span.errorMessage && (
                                <div className="text-[10px] text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 mt-1">
                                    {span.errorMessage}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}