// client/src/features/incidents/components/GraphConnections.tsx
import React from 'react';
import { motion } from 'framer-motion';
import type { TraceGraphEdge, TraceGraphNode } from '../../api/incident.service';

// Defines the data requirements for rendering the visual links between service nodes
interface GraphConnectionsProps {
    edges: TraceGraphEdge[];
    nodes: TraceGraphNode[];
    positions: Map<string, { x: number; y: number }>;
    config: { nodeWidth: number; nodeHeight: number };
}

/**
 * GraphConnections Component
 * Renders an SVG overlay that draws animated Bezier curves between microservices.
 * Visualizes request flow and highlights failure paths using directional arrows.
 */
export const GraphConnections = ({ edges, nodes, positions, config }: GraphConnectionsProps) => {
    return (
        <svg className="absolute inset-0 pointer-events-none overflow-visible" width="100%" height="100%">
            <defs>
                {/* Arrowhead markers for standard request flow */}
                <marker id="arrow-blue" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
                </marker>
                
                {/* Arrowhead markers for error paths */}
                <marker id="arrow-red" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                </marker>
                
                {/* Neon glow effect for active request animations */}
                <filter id="neon" filterUnits="userSpaceOnUse" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="1.5" result="blur"/>
                    <feMerge>
                        <feMergeNode in="blur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            
            {edges.map((edge, i) => {
                const s = positions.get(edge.source);
                const t = positions.get(edge.target);
                
                // Skip rendering if source or target coordinates are missing
                if (!s || !t) return null;

                // Calculates start and end coordinates based on node dimensions
                const startX = s.x + config.nodeWidth;
                const startY = s.y + config.nodeHeight / 2;
                const endX = t.x;
                const endY = t.y + config.nodeHeight / 2;
                
                // Determines the curvature offset for the Bezier path
                const offset = Math.min((endX - startX) * 0.5, 80);
                
                // Constructs the cubic Bezier path string
                const path = `M ${startX} ${startY} C ${startX + offset} ${startY}, ${endX - offset} ${endY}, ${endX} ${endY}`;
                
                // Checks if the destination service has an active error to style the connection
                const isErr = nodes.find(n => n.id === edge.target)?.hasError;
                
                return (
                    <g key={i}>
                        {/* Static background path for consistent visual structure */}
                        <path 
                            d={path} 
                            fill="none" 
                            stroke={isErr ? "#ef4444" : "#6366f1"} 
                            strokeOpacity="0.2" 
                            strokeWidth="2" 
                            markerEnd={isErr ? "url(#arrow-red)" : "url(#arrow-blue)"} 
                        />
                        
                        {/* Animated overlay path representing active traffic flow */}
                        <motion.path 
                            d={path} 
                            fill="none" 
                            stroke={isErr ? "#ef4444" : "#6366f1"} 
                            strokeWidth="2.5" 
                            strokeDasharray="8 12"
                            animate={{ strokeDashoffset: [0, -40] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                            markerEnd={isErr ? "url(#arrow-red)" : "url(#arrow-blue)"}
                            filter="url(#neon)"
                        />
                    </g>
                );
            })}
        </svg>
    );
};