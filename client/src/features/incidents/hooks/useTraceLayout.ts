// client/src/features/incidents/hooks/useTraceLayout.ts
import { useMemo } from 'react';
import type { TraceGraph, TraceGraphNode } from '../api/incident.service';

/**
 * Global Configuration for the Graph Layout
 * Defines spatial constants for node sizing and grid distribution.
 */
export const LAYOUT_CONFIG = {
    nodeWidth: 220,
    nodeHeight: 75,
    levelWidth: 350,
    verticalSpacing: 150,
    centerY: 400
};

/**
 * useTraceLayout Hook
 * Calculates the spatial positioning (X, Y coordinates) for microservice nodes
 * using a layered (hierarchical) directed graph algorithm.
 * * @param graphData - The raw nodes and edges representing the service dependencies.
 */
export function useTraceLayout(graphData: TraceGraph | null) {
    return useMemo(() => {
        // Fallback: Ensures the layout configuration is accessible even if data is missing
        if (!graphData) {
            return { 
                nodePositions: new Map<string, { x: number; y: number }>(), 
                levels: [],
                config: LAYOUT_CONFIG 
            };
        }

        const nodePositions = new Map<string, { x: number; y: number }>();
        const incomingEdgeCounts = new Map<string, number>();

        // 1. Identify "Roots": Services that receive no incoming requests in this trace
        graphData.nodes.forEach(n => incomingEdgeCounts.set(n.id, 0));
        graphData.edges.forEach(e => {
            incomingEdgeCounts.set(e.target, (incomingEdgeCounts.get(e.target) || 0) + 1);
        });

        const roots = graphData.nodes.filter(n => incomingEdgeCounts.get(n.id) === 0);

        // 2. Breadth-First Level Assignment
        // Groups nodes into "levels" based on their distance from the root services
        const levels: TraceGraphNode[][] = [];
        let currentLevel = roots;
        const processed = new Set<string>();

        while (currentLevel.length > 0) {
            levels.push(currentLevel);
            currentLevel.forEach(n => processed.add(n.id));
            
            const nextLevel: TraceGraphNode[] = [];
            currentLevel.forEach(node => {
                // Find all destination nodes connected to the current level
                graphData.edges
                    .filter(e => e.source === node.id)
                    .forEach(edge => {
                        const child = graphData.nodes.find(n => n.id === edge.target);
                        // Prevent cycles and duplicate entries in the same level
                        if (child && !processed.has(child.id) && !nextLevel.find(n => n.id === child.id)) {
                            nextLevel.push(child);
                        }
                    });
            });
            currentLevel = nextLevel;
        }

        // 3. Coordinate Calculation
        // Maps the calculated levels into a 2D coordinate space
        levels.forEach((levelNodes, depth) => {
            // Calculates vertical centering to ensure the graph grows symmetrically from the center
            const totalHeight = (levelNodes.length - 1) * LAYOUT_CONFIG.verticalSpacing;
            const startY = LAYOUT_CONFIG.centerY - (totalHeight / 2);

            levelNodes.forEach((node, i) => {
                nodePositions.set(node.id, { 
                    // Horizontal position is determined by logical depth (hops from root)
                    x: depth * LAYOUT_CONFIG.levelWidth + 100, 
                    // Vertical position is determined by its index within the level group
                    y: startY + i * LAYOUT_CONFIG.verticalSpacing 
                });
            });
        });

        return { nodePositions, levels, config: LAYOUT_CONFIG };
    }, [graphData]);
}