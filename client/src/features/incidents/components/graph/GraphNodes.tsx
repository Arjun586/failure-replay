// client/src/features/incidents/components/GraphNodes.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock } from 'lucide-react';
import type { TraceGraphNode } from '../../api/incident.service';

/**
 * Interface Definition
 * Defines the props for rendering individual service nodes within the dependency graph.
 */
interface GraphNodesProps {
    nodes: TraceGraphNode[];
    positions: Map<string, { x: number; y: number }>;
    config: { nodeWidth: number; nodeHeight: number };
    onSelectNode: (node: TraceGraphNode) => void;
}

/**
 * GraphNodes Component
 * Renders interactive service cards as part of the distributed trace visualization.
 * Highlights microservices with errors and displays temporal metrics for each node.
 */
export const GraphNodes = ({ nodes, positions, config, onSelectNode }: GraphNodesProps) => {
    return (
        <>
            {nodes.map((node) => {
                // Retrieves the pre-calculated coordinates for the specific service node
                const pos = positions.get(node.id);
                if (!pos) return null;

                return (
                    <motion.div
                        key={node.id}
                        // Triggers the selection callback to display detailed metrics/logs for this service
                        onClick={() => onSelectNode(node)}
                        // Interactive animation settings for depth and focus
                        whileHover={{ scale: 1.05, y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}
                        className={`absolute p-4 rounded-xl border-2 backdrop-blur-xl cursor-pointer transition-colors duration-300
                            ${node.hasError 
                                ? "bg-red-500/10 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]" 
                                : "bg-surface/90 border-surfaceBorder"}
                        `} 
                        // Positions the card precisely on the graph canvas based on layout configuration
                        style={{ 
                            left: pos.x, 
                            top: pos.y, 
                            width: config.nodeWidth, 
                            height: config.nodeHeight 
                        }}
                    >
                        {/* Service Metadata: Displays the service name and error status icon */}
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-xs font-bold text-gray-200 truncate">
                                {node.service}
                            </span>
                            {node.hasError && (
                                <AlertCircle size={14} className="text-red-500 shrink-0" />
                            )}
                        </div>

                        {/* Latency Metrics: Shows the service's total processing time for this trace */}
                        <div className="flex items-center gap-2 text-[10px] text-muted font-mono bg-black/40 px-2 py-1 rounded w-fit">
                            <Clock 
                                size={10} 
                                className={node.hasError ? "text-red-400" : "text-primary"} 
                            />
                            {node.duration}ms
                        </div>
                    </motion.div>
                );
            })}
        </>
    );
};