import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Server, AlertCircle, Clock, Loader2, Hand, Maximize, Minimize } from "lucide-react";
import { traceService, type TraceGraph as TraceGraphType } from "../api/incident.service";

interface TraceGraphProps {
    traceId: string;
}

export default function TraceGraph({ traceId }: TraceGraphProps) {
    const [graphData, setGraphData] = useState<TraceGraphType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false); // Nayi state Fullscreen ke liye
    const containerRef = useRef<HTMLDivElement>(null);

    // Fetch data
    useEffect(() => {
        const fetchGraph = async () => {
            try {
                setIsLoading(true);
                const data = await traceService.getTraceGraph(traceId);
                setGraphData(data);
            } catch (err) {
                console.error("Failed to load trace graph", err);
                setError("Failed to generate dependency graph for this trace.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchGraph();
    }, [traceId]);

    // Background body scroll lock jab fullscreen on ho
    useEffect(() => {
        if (isFullscreen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isFullscreen]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[400px] bg-surfaceBorder/10 rounded-xl border border-surfaceBorder border-dashed">
                <Loader2 className="text-primary animate-spin mr-3" size={24} />
                <span className="text-muted font-medium">Analyzing service dependencies...</span>
            </div>
        );
    }

    if (error || !graphData || graphData.nodes.length === 0) {
        return (
            <div className="p-6 bg-surfaceBorder/10 rounded-xl border border-surfaceBorder text-center">
                <p className="text-muted text-sm">Dependency graph unavailable for this trace.</p>
            </div>
        );
    }

    // Canvas Configuration
    const nodeWidth = 220;
    const nodeHeight = 75;
    const levelWidth = 350; 
    
    const incomingEdgeCounts = new Map<string, number>();
    graphData.nodes.forEach(n => incomingEdgeCounts.set(n.id, 0));
    graphData.edges.forEach(e => {
        incomingEdgeCounts.set(e.target, (incomingEdgeCounts.get(e.target) || 0) + 1);
    });

    const roots = graphData.nodes.filter(n => incomingEdgeCounts.get(n.id) === 0);
    const nodePositions = new Map<string, { x: number; y: number }>();
    
    let currentLevel = roots;
    let depth = 0;

    while (currentLevel.length > 0) {
        const nextLevel: typeof graphData.nodes = [];
        currentLevel.forEach((node, i) => {
            if (!nodePositions.has(node.id)) {
                nodePositions.set(node.id, {
                    x: depth * levelWidth + 50,
                    y: (i * (nodeHeight + 50)) + 50 
                });
                
                const childrenEdges = graphData.edges.filter(e => e.source === node.id);
                childrenEdges.forEach(edge => {
                    const childNode = graphData.nodes.find(n => n.id === edge.target);
                    if (childNode && !nextLevel.find(n => n.id === childNode.id)) {
                        nextLevel.push(childNode);
                    }
                });
            }
        });
        currentLevel = nextLevel;
        depth++;
    }

    const maxX = Math.max(...Array.from(nodePositions.values()).map(p => p.x));
    const maxY = Math.max(...Array.from(nodePositions.values()).map(p => p.y));
    
    const canvasWidth = Math.max(maxX + nodeWidth + 200, 1000);
    const canvasHeight = Math.max(maxY + nodeHeight + 200, 600);

    return (
        // Wrapper ki classes conditionally change hongi based on isFullscreen
        <div className={`flex flex-col bg-surface shadow-sm overflow-hidden transition-all duration-300 ${
            isFullscreen 
                ? "fixed inset-0 z-[100] w-screen h-screen rounded-none" 
                : "relative w-full h-[500px] border border-surfaceBorder rounded-xl"
        }`}>
            
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-4 border-b border-surfaceBorder bg-surfaceBorder/20 z-10 shrink-0">
                <div className="flex items-center gap-2">
                    <Server className="text-primary" size={18} />
                    <h3 className="font-bold text-gray-200">Service Dependency Graph</h3>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 text-xs text-muted bg-background px-3 py-1.5 rounded-full border border-surfaceBorder shadow-sm">
                        <Hand size={14} className="text-primary" /> Drag to pan
                    </div>
                    
                    {/* Expand/Collapse Button */}
                    <button 
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:text-white bg-surfaceBorder/30 hover:bg-surfaceBorder/60 rounded-lg transition-colors border border-surfaceBorder/50"
                        title={isFullscreen ? "Close Fullscreen" : "Expand to Fullscreen"}
                    >
                        {isFullscreen ? (
                            <><Minimize size={16} /> <span className="hidden sm:inline">Close</span></>
                        ) : (
                            <><Maximize size={16} /> <span className="hidden sm:inline">Expand</span></>
                        )}
                    </button>
                </div>
            </div>

            {/* Draggable Interactive Viewport */}
            <div 
                ref={containerRef} 
                className="relative flex-1 overflow-hidden cursor-grab active:cursor-grabbing bg-[#09090b]"
            >
                {/* Dot Grid Background */}
                <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

                <motion.div
                    drag
                    dragConstraints={containerRef}
                    dragElastic={0.1}
                    className="absolute top-0 left-0"
                    style={{ width: canvasWidth, height: canvasHeight }}
                >
                    {/* SVG Arrows Layer */}
                    <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" opacity="0.6" />
                            </marker>
                        </defs>
                        
                        {graphData.edges.map((edge, i) => {
                            const sourcePos = nodePositions.get(edge.source);
                            const targetPos = nodePositions.get(edge.target);
                            if (!sourcePos || !targetPos) return null;

                            const startX = sourcePos.x + nodeWidth;
                            const startY = sourcePos.y + (nodeHeight / 2);
                            const endX = targetPos.x;
                            const endY = targetPos.y + (nodeHeight / 2);

                            const controlPointX1 = startX + 60;
                            const controlPointX2 = endX - 60;

                            return (
                                <motion.path
                                    key={i}
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.8, delay: i * 0.15 }}
                                    d={`M ${startX} ${startY} C ${controlPointX1} ${startY}, ${controlPointX2} ${endY}, ${endX} ${endY}`}
                                    fill="none"
                                    stroke="#6366f1"
                                    strokeOpacity="0.4"
                                    strokeWidth="2"
                                    markerEnd="url(#arrowhead)"
                                />
                            );
                        })}
                    </svg>

                    {/* Nodes Layer */}
                    {graphData.nodes.map((node, i) => {
                        const pos = nodePositions.get(node.id);
                        if (!pos) return null;

                        return (
                            <motion.div
                                key={node.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4, delay: i * 0.1 }}
                                className={`absolute flex flex-col justify-center px-4 py-3 rounded-lg border shadow-lg backdrop-blur-md transition-colors
                                    ${node.hasError 
                                        ? "bg-red-500/10 border-red-500/50 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.1)]" 
                                        : "bg-surface/80 border-surfaceBorder text-gray-200"
                                    }`}
                                style={{
                                    left: pos.x,
                                    top: pos.y,
                                    width: nodeWidth,
                                    height: nodeHeight
                                }}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-mono text-[13px] font-bold truncate pr-2 tracking-tight">
                                        {node.service}
                                    </span>
                                    {node.hasError && <AlertCircle size={16} className="text-red-500 shrink-0" />}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted bg-background/50 w-fit px-2 py-0.5 rounded border border-surfaceBorder/50">
                                    <Clock size={12} className={node.hasError ? "text-red-400" : "text-primary"} />
                                    <span className="font-mono">{node.duration}ms</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </div>
    );
}