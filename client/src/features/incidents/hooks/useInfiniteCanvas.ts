// client/src/features/incidents/hooks/useInfiniteCanvas.ts
import { useMotionValue, animate } from 'framer-motion';
import React, { useEffect } from 'react';

/**
 * useInfiniteCanvas Hook
 * Manages spatial transformations (pan and zoom) for a 2D canvas interface.
 * Implements custom "Ctrl+Wheel" zooming logic while allowing standard page 
 * scrolling when the modifier key is not present.
 */
export function useInfiniteCanvas(containerRef: React.RefObject<HTMLDivElement | null>) {
    // Initializes motion values for hardware-accelerated transformations
    const scale = useMotionValue(1);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        /**
         * Native Wheel Handler
         * Intercepts wheel events to perform zooming relative to the mouse cursor.
         */
        const handleNativeWheel = (e: WheelEvent) => {
            // 1. Hijacks the scroll event only if Ctrl (Windows) or Cmd (Mac) is held
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault(); // Prevents the browser's default full-page zoom
                
                const zoomSpeed = 0.002; 
                const delta = -e.deltaY;
                const currentScale = scale.get();
                
                // Constraints: Restricts zoom level between 20% and 300%
                const newScale = Math.min(Math.max(currentScale + delta * zoomSpeed, 0.2), 3);

                // Calculates mouse position relative to the canvas container
                const rect = container.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                const scaleRatio = newScale / currentScale;

                // Adjusts translation offsets (x, y) to maintain the focus point under the cursor
                x.set(mouseX - (mouseX - x.get()) * scaleRatio);
                y.set(mouseY - (mouseY - y.get()) * scaleRatio);
                scale.set(newScale);
            } 
            // 2. If no modifier key is held, the event propagates for normal page scrolling
        };

        // Passive: false is required to allow e.preventDefault() for the wheel event
        container.addEventListener('wheel', handleNativeWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleNativeWheel);
        };
    }, [containerRef, scale, x, y]);

    /**
     * Resets the canvas to its default state (centered, 1:1 scale) 
     * using a smooth spring/tween animation.
     */
    const resetView = () => {
        animate(x, 0, { duration: 0.5 });
        animate(y, 0, { duration: 0.5 });
        animate(scale, 1, { duration: 0.5 });
    };

    return { x, y, scale, resetView };
}