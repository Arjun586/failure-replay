export interface ReplayOSOptions {
    projectId?: string;
    ingestKey?: string;
    serviceName?: string;
    ingestUrl?: string;
    debug?: boolean;
}
export declare const ReplayOS: {
    /**
     * Initializes the ReplayOS SDK.
     * Will automatically pick up credentials from environment variables if not provided.
     */
    init: (options?: ReplayOSOptions) => void;
    /**
     * Manually records an error to the current active span.
     */
    recordError: (error: Error | string) => void;
    /**
     * Helper to get the tracer for manual span creation
     */
    getTracer: () => import("@opentelemetry/api").Tracer;
    /**
     * Ensures all pending traces are sent before the process exits.
     */
    shutdown: () => Promise<void>;
};
