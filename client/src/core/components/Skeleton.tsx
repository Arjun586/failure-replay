// client/src/core/components/Skeleton.tsx
interface SkeletonProps {
    className?: string;
}

// Renders a pulsed loading placeholder to improve perceived performance
export function Skeleton({ className = "" }: SkeletonProps) {
    return (
        <div 
            className={`animate-pulse bg-surfaceBorder/30 rounded-md ${className}`} 
            aria-hidden="true"
        />
    );
}