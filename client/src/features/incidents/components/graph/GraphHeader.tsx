// client/src/features/incidents/components/GraphHeader.tsx
import React from 'react';
import { Server, Search, MousePointer2, Hand, Maximize, Minimize } from 'lucide-react';

/**
 * Interface Definition
 * Defines the control functions and state for managing the graph visualization's viewport.
 */
interface GraphHeaderProps {
    resetView: () => void;
    isFullscreen: boolean;
    setIsFullscreen: (val: boolean) => void;
}

/**
 * GraphHeader Component
 * Provides a persistent control bar for the interactive dependency graph, 
 * including navigation hints and view state toggles.
 */
export const GraphHeader = ({ resetView, isFullscreen, setIsFullscreen }: GraphHeaderProps) => {
    return (
        <div className="flex items-center justify-between p-4 border-b border-surfaceBorder bg-surface/80 backdrop-blur-md z-10">
            {/* Branding and View Reset Section */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Server className="text-primary" size={18} />
                    <h3 className="font-bold text-gray-200">Interactive Dependency Graph</h3>
                </div>
                {/* Button to restore original zoom and translation coordinates */}
                <button 
                    onClick={resetView} 
                    className="p-1.5 hover:bg-surfaceBorder/50 rounded-lg text-muted transition-colors flex items-center gap-2 text-xs border border-surfaceBorder"
                >
                    <Search size={14} /> Reset View
                </button>
            </div>

            {/* Viewport Controls and Navigation Guide */}
            <div className="flex items-center gap-3">
                {/* Visual Legend: Instructs the user on how to interact with the Canvas*/}
                <div className="hidden sm:flex items-center gap-4 px-3 py-1.5 bg-background rounded-full border border-surfaceBorder text-[10px] text-muted font-mono uppercase tracking-widest">
                    <div className="flex items-center gap-1.5"><MousePointer2 size={12} /> Drag to Pan</div>
                    <div className="w-px h-3 bg-surfaceBorder" />
                    <div className="flex items-center gap-1.5"><Hand size={12} /> Ctrl + Scroll to Zoom</div>
                </div>

                {/* Fullscreen Toggle: Expands the graph to fill the entire browser window */}
                <button 
                    onClick={() => setIsFullscreen(!isFullscreen)} 
                    className="p-2 hover:bg-surfaceBorder/50 rounded-lg text-gray-300 border border-surfaceBorder"
                >
                    {/* Dynamically switches icon based on the current window state */}
                    {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                </button>
            </div>
        </div>
    );
};