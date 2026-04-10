import React, { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Server, AlertCircle, Clock, Loader2, Hand, Maximize, Minimize, ActivitySquare, X, ListTree, Search, MousePointer2 } from "lucide-react";
import { traceService, type TraceGraph as TraceGraphType } from "../api/incident.service";
import { AnimatePresence } from "framer-motion";

interface TraceGraphProps {
    traceId: string;
    onViewLogs?: (spanId: string) => void;
}

export default function TraceGraph({ traceId, onViewLogs }: TraceGraphProps) {
    const [graphData, setGraphData] = useState<TraceGraphType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [selectedNode, setSelectedNode] = useState<any | null>(null);
    
    // 🚀 Infinite Canvas States
    const containerRef = useRef<HTMLDivElement>(null);
    const scale = useMotionValue(1);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

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

    // 🚀 Magic Zoom Logic
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const zoomSpeed = 0.001;
        const delta = -e.deltaY;
        const newScale = Math.min(Math.max(scale.get() + delta * zoomSpeed, 0.2), 3);
        
        // Zoom towards cursor position
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const currentScale = scale.get();
            const scaleRatio = newScale / currentScale;

            x.set(mouseX - (mouseX - x.get()) * scaleRatio);
            y.set(mouseY - (mouseY - y.get()) * scaleRatio);
            scale.set(newScale);
        }
    };

    const resetView = () => {
        animate(x, 0, { duration: 0.5 });
        animate(y, 0, { duration: 0.5 });
        animate(scale, 1, { duration: 0.5 });
    };

    useEffect(() => {
        if (isFullscreen || selectedNode) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "unset";
    }, [isFullscreen, selectedNode]);

    if (isLoading) return <div className="flex items-center justify-center h-[400px] bg-surfaceBorder/10 rounded-xl border border-dashed"><Loader2 className="text-primary animate-spin mr-3" /></div>;
    if (error || !graphData) return <div className="p-6 text-center text-muted">Graph unavailable.</div>;

    // Layout Constants
    const nodeWidth = 220;
    const nodeHeight = 75;
    const levelWidth = 350;
    const verticalSpacing = 150; 
    const centerY = 400; // 🚀 Canvas ka base vertical center

    const nodePositions = new Map<string, { x: number; y: number }>();

    // 1. Find root nodes (nodes with 0 incoming edges)
    const incomingEdgeCounts = new Map<string, number>();
    graphData.nodes.forEach(n => incomingEdgeCounts.set(n.id, 0));
    graphData.edges.forEach(e => incomingEdgeCounts.set(e.target, (incomingEdgeCounts.get(e.target) || 0) + 1));
    const roots = graphData.nodes.filter(n => incomingEdgeCounts.get(n.id) === 0);

    // 2. 🚀 NEW ALGORITHM: Group nodes by level first
    const levels: any[][] = [];
    let currentLevel = roots;
    const processed = new Set<string>();

    while (currentLevel.length > 0) {
        levels.push(currentLevel);
        currentLevel.forEach(n => processed.add(n.id));

        const nextLevel: any[] = [];
        currentLevel.forEach(node => {
            graphData.edges.filter(e => e.source === node.id).forEach(edge => {
                const child = graphData.nodes.find(n => n.id === edge.target);
                // Ensure we don't process a node twice (prevents infinite loops)
                if (child && !processed.has(child.id) && !nextLevel.find(n => n.id === child.id)) {
                    nextLevel.push(child);
                }
            });
        });
        currentLevel = nextLevel;
    }

    // 3. 🚀 NEW ALGORITHM: Assign positions centered around the Y-axis
    levels.forEach((levelNodes, depth) => {
        // Calculate total height this level will take
        const totalHeight = levelNodes.length * verticalSpacing;
        
        // Find the starting Y position so the whole group is centered at centerY
        const startY = centerY - (totalHeight / 2) + (verticalSpacing / 2);

        levelNodes.forEach((node, i) => {
            nodePositions.set(node.id, { 
                x: depth * levelWidth + 100, 
                y: startY + i * verticalSpacing 
            });
        });
    });

    return (
        <div 
            className={`flex flex-col bg-surface shadow-sm overflow-hidden transition-all duration-300 border-surfaceBorder ${
                isFullscreen ? "fixed inset-0 z-[100] w-screen h-screen" : "relative w-full h-[600px] border rounded-xl"
            }`}
        >
            {/* Header Controls */}
            <div className="flex items-center justify-between p-4 border-b border-surfaceBorder bg-surface/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Server className="text-primary" size={18} />
                        <h3 className="font-bold text-gray-200">Interactive Dependency Graph</h3>
                    </div>
                    <button onClick={resetView} className="p-1.5 hover:bg-surfaceBorder/50 rounded-lg text-muted transition-colors flex items-center gap-2 text-xs border border-surfaceBorder">
                        <Search size={14} /> Reset View
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-4 px-3 py-1.5 bg-background rounded-full border border-surfaceBorder text-[10px] text-muted font-mono uppercase tracking-widest">
                        <div className="flex items-center gap-1.5"><MousePointer2 size={12} /> Drag to Pan</div>
                        <div className="w-px h-3 bg-surfaceBorder" />
                        <div className="flex items-center gap-1.5"><Hand size={12} /> Scroll to Zoom</div>
                    </div>
                    <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 hover:bg-surfaceBorder/50 rounded-lg text-gray-300 border border-surfaceBorder">
                        {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                    </button>
                </div>
            </div>

            {/* 🚀 THE INFINITE CANVAS */}
            <div 
                ref={containerRef}
                onWheel={handleWheel}
                className="relative flex-1 bg-[#070708] cursor-grab active:cursor-grabbing overflow-hidden"
            >
                {/* Dot Grid follows the pan and zoom */}
                <motion.div 
                    style={{ x, y, scale }}
                    className="absolute inset-0 pointer-events-none opacity-20"
                >
                    {/* 🚀 FIX 1: Increased grid size to 20000px so the background never cuts off */}
                    <div className="absolute top-1/2 left-1/2 w-[20000px] h-[20000px] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:40px_40px] -translate-x-1/2 -translate-y-1/2" />
                </motion.div>

                <motion.div
                    drag
                    dragMomentum={false}
                    style={{ x, y, scale }}
                    className="absolute inset-0 origin-center"
                >
                    {/* 🚀 FIX 2: Giant Invisible Drag Surface to ensure you never run out of draggable space */}
                    <div className="absolute top-1/2 left-1/2 w-[20000px] h-[20000px] -translate-x-1/2 -translate-y-1/2 bg-transparent" />

                    {/* 🚀 FIX 3: Changed SVG to overflow-visible so lines never clip regardless of graph size */}
                    <svg className="absolute inset-0 pointer-events-none overflow-visible" width="100%" height="100%">
                        <defs>
                            <marker id="arrow-blue" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" /></marker>
                            <marker id="arrow-red" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" /></marker>
                            
                            {/* 🚀 THE FIX: filterUnits="userSpaceOnUse" ensures the glow never clips 0-height straight lines */}
                            <filter id="neon" filterUnits="userSpaceOnUse" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="1.5" result="blur"/>
                                <feMerge>
                                    <feMergeNode in="blur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        </defs>
                        
                        {graphData.edges.map((edge, i) => {
                            const s = nodePositions.get(edge.source);
                            const t = nodePositions.get(edge.target);
                            if (!s || !t) return null;

                            const startX = s.x + nodeWidth;
                            const startY = s.y + nodeHeight / 2;
                            const endX = t.x;
                            const endY = t.y + nodeHeight / 2;

                            const deltaX = endX - startX;
                            const deltaY = endY - startY;
                            
                            const offset = Math.min(deltaX * 0.5, 80);

                            const cp1X = startX + offset;
                            const cp1Y = startY; 
                            
                            const cp2X = endX - offset;
                            const cp2Y = endY - deltaY * 0.15; 

                            // 🚀 Ab humein 0.01 wale hack ki zaroorat nahi hai
                            const path = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
                            const isErr = graphData.nodes.find(n => n.id === edge.target)?.hasError;
                            
                            return (
                                <g key={i}>
                                    {/* 🚀 Safety ke liye humne base path par bhi pointer laga diya hai */}
                                    <path d={path} fill="none" stroke={isErr ? "#ef4444" : "#6366f1"} strokeOpacity="0.2" strokeWidth="2" markerEnd={isErr ? "url(#arrow-red)" : "url(#arrow-blue)"} />
                                    <motion.path 
                                        d={path} fill="none" stroke={isErr ? "#ef4444" : "#6366f1"} strokeWidth="2.5" strokeDasharray="8 12"
                                        animate={{ strokeDashoffset: [0, -40] }}
                                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                        markerEnd={isErr ? "url(#arrow-red)" : "url(#arrow-blue)"}
                                        filter="url(#neon)"
                                    />
                                </g>
                            );
                        })}
                    </svg>

                    {graphData.nodes.map((node) => {
                        const pos = nodePositions.get(node.id);
                        if (!pos) return null;
    
                        return (
                            <motion.div
                                key={node.id}
                                onClick={() => setSelectedNode(node)}
                                whileHover={{ scale: 1.05, y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}
                                className={`absolute p-4 rounded-xl border-2 backdrop-blur-xl cursor-pointer transition-colors duration-300
                                    ${node.hasError ? "bg-red-500/10 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]" : "bg-surface/90 border-surfaceBorder"}
                                `}
                                style={{ left: pos.x, top: pos.y, width: nodeWidth, height: nodeHeight }}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-mono text-xs font-bold text-gray-200">{node.service}</span>
                                    {node.hasError && <AlertCircle size={14} className="text-red-500" />}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-muted font-mono bg-black/40 px-2 py-1 rounded w-fit">
                                    <Clock size={10} className={node.hasError ? "text-red-400" : "text-primary"} />
                                    {node.duration}ms
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>

            {/* Sidebar Inspector Code [cite: 1216, 1217] */}
            <AnimatePresence>
                {selectedNode && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedNode(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[105]" />
                        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30 }} className="absolute top-0 right-0 h-full w-[400px] bg-surface border-l border-surfaceBorder z-[110] p-6 shadow-2xl">
                            <div className="flex justify-between items-center mb-8 pb-4 border-b border-surfaceBorder">
                                <h2 className="text-lg font-bold flex items-center gap-2"><ActivitySquare className="text-primary" /> Service Detail</h2>
                                <button onClick={() => setSelectedNode(null)} className="p-1 hover:bg-surfaceBorder rounded"><X /></button>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-background/50 p-4 rounded-lg border border-surfaceBorder">
                                    <label className="text-[10px] text-muted uppercase font-bold">Service Name</label>
                                    <div className="text-xl font-mono text-gray-100">{selectedNode.service}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-background/50 p-4 rounded-lg border border-surfaceBorder">
                                        <label className="text-[10px] text-muted uppercase font-bold">Total Duration</label>
                                        <div className="text-lg font-mono text-primary">{selectedNode.duration}ms</div>
                                    </div>
                                    <div className="bg-background/50 p-4 rounded-lg border border-surfaceBorder">
                                        <label className="text-[10px] text-muted uppercase font-bold">Status</label>
                                        <div className={`text-lg font-bold ${selectedNode.hasError ? 'text-red-500' : 'text-green-500'}`}>{selectedNode.hasError ? 'FAILING' : 'HEALTHY'}</div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => { onViewLogs?.(selectedNode.id); setSelectedNode(null); setIsFullscreen(false); }}
                                    className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
                                >
                                    <ListTree size={18} /> Jump to Logs
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}