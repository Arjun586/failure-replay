// client/src/features/incidents/components/TraceGraph.tsx
import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

import { traceService, type TraceGraph as TraceGraphType } from "../api/incident.service";
import { useTraceLayout } from "../hooks/useTraceLayout";
import { useInfiniteCanvas } from "../hooks/useInfiniteCanvas";

import { GraphHeader } from "./graph/GraphHeader";
import { GraphConnections } from "./graph/GraphConnections";
import { GraphNodes } from "./graph/GraphNodes";
import { NodeInspector } from "./graph/NodeInspector";

/**
 * Interface Definition
 * traceId: The unique identifier for the distributed trace to be mapped.
 * onViewLogs: Optional callback to link a specific service node to the timeline view.
 */
interface TraceGraphProps {
    traceId: string;
    onViewLogs?: (spanId: string) => void;
}

/**
 * TraceGraph Component
 * Visualizes microservice dependencies for a specific trace using an infinite canvas.
 * Features native Ctrl+Scroll zooming, panning, and a full-screen mode for complex architectures.
 */
export default function TraceGraph({ traceId, onViewLogs }: TraceGraphProps) {
    // State management for graph telemetry and UI visibility
    const [graphData, setGraphData] = useState<TraceGraphType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [selectedNode, setSelectedNode] = useState<any | null>(null);
    
    const containerRef = useRef<HTMLDivElement>(null);

    /**
     * Effect: Fetches the service dependency graph data when the traceId changes.
     */
    useEffect(() => {
        const fetchGraph = async () => {
            try {
                setIsLoading(true);
                const data = await traceService.getTraceGraph(traceId);
                setGraphData(data);
            } catch {
                setError("Failed to generate dependency graph.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchGraph();
    }, [traceId]);

    // Headless logic delegation for node placement and canvas transformation
    const { nodePositions, config } = useTraceLayout(graphData);
    const { x, y, scale, resetView } = useInfiniteCanvas(containerRef);

    /**
     * Effect: Implements a native wheel listener to handle zooming.
     * Intercepts "Ctrl+Scroll" to prevent global browser zooming while allowing 
     * natural page scrolling when the modifier key is not held.
     */
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleNativeWheel = (e: WheelEvent) => {
            // Only intercept the wheel event if Ctrl (Windows/Linux) or Cmd (Mac) is held
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault(); // Stop the browser from zooming the entire page
                
                const zoomSpeed = 0.002;
                const delta = -e.deltaY;
                const newScale = Math.min(Math.max(scale.get() + delta * zoomSpeed, 0.2), 3);

                const rect = container.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                const currentScale = scale.get();
                const scaleRatio = newScale / currentScale;

                // Adjust canvas offsets to zoom relative to the mouse cursor position
                x.set(mouseX - (mouseX - x.get()) * scaleRatio);
                y.set(mouseY - (mouseY - y.get()) * scaleRatio);
                scale.set(newScale);
            }
        };

        // Passive: false is required to allow e.preventDefault() to function correctly
        container.addEventListener('wheel', handleNativeWheel, { passive: false });
        return () => {
            container.removeEventListener('wheel', handleNativeWheel);
        };
    }, [scale, x, y, isLoading]);

    /**
     * Effect: Prevents background body scrolling when the graph is in fullscreen 
     * or when a specific service inspector is active.
     */
    useEffect(() => {
        if (isFullscreen || selectedNode) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "unset";
    }, [isFullscreen, selectedNode]);

    // Loading State: Centered spinner placeholder
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[400px] bg-surfaceBorder/10 rounded-xl border border-dashed border-surfaceBorder">
                <Loader2 className="text-primary animate-spin" />
            </div>
        );
    }

    // Error State: Feedback when graph generation fails
    if (error || !graphData) {
        return <div className="p-6 text-center text-muted">Graph unavailable.</div>;
    }

    return (
        <div 
            className={`flex flex-col bg-surface shadow-sm overflow-hidden transition-all duration-300 border-surfaceBorder ${
                isFullscreen ? "fixed inset-0 z-[100] w-screen h-screen" : "relative w-full h-[600px] border rounded-xl"
            }`}
        >
            {/* Control Bar: View resets and full-screen toggles */}
            <GraphHeader 
                resetView={resetView} 
                isFullscreen={isFullscreen} 
                setIsFullscreen={setIsFullscreen} 
            />

            {/* Canvas Container: The interactive area for panning and zooming */}
            <div 
                ref={containerRef}
                className="relative flex-1 bg-[#070708] cursor-grab active:cursor-grabbing overflow-hidden"
            >
                {/* Background Grid: Parallax background for visual depth perception */}
                <motion.div style={{ x, y, scale }} className="absolute inset-0 pointer-events-none opacity-20">
                    <div className="absolute top-1/2 left-1/2 w-[20000px] h-[20000px] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:40px_40px] -translate-x-1/2 -translate-y-1/2" />
                </motion.div>

                {/* Main Graph Layer: Handles spatial distribution of nodes and connections */}
                <motion.div drag dragMomentum={false} style={{ x, y, scale }} className="absolute inset-0 origin-center">
                    {/* Transparent overlay to catch drag events across the entire canvas */}
                    <div className="absolute top-1/2 left-1/2 w-[20000px] h-[20000px] -translate-x-1/2 -translate-y-1/2 bg-transparent" />

                    <GraphConnections edges={graphData.edges} nodes={graphData.nodes} positions={nodePositions} config={config} />
                    <GraphNodes nodes={graphData.nodes} positions={nodePositions} config={config} onSelectNode={setSelectedNode} />
                </motion.div>
            </div>

            {/* Node Inspector: Details panel for the selected microservice */}
            <AnimatePresence>
                {selectedNode && (
                    <NodeInspector 
                        node={selectedNode} 
                        onClose={() => setSelectedNode(null)} 
                        onViewLogs={(id) => {
                            onViewLogs?.(id);
                            setSelectedNode(null);
                            setIsFullscreen(false);
                        }} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
}