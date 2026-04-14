// packages/node-sdk/src/index.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { diag, DiagConsoleLogger, DiagLogLevel, trace, Span, SpanStatusCode } from '@opentelemetry/api';

export interface ReplayOSOptions {
    projectId?: string;
    ingestKey?: string;
    serviceName?: string;
    ingestUrl?: string; 
    debug?: boolean;
}

let sdk: NodeSDK | null = null;

export const ReplayOS = {
    /**
     * Initializes the ReplayOS SDK. 
     * Will automatically pick up credentials from environment variables if not provided.
     */
    init: (options: ReplayOSOptions = {}) => {
        const projectId = options.projectId || process.env.REPLAYOS_PROJECT_ID;
        const ingestKey = options.ingestKey || process.env.REPLAYOS_INGEST_KEY;
        const serviceName = options.serviceName || process.env.REPLAYOS_SERVICE_NAME || 'unnamed-service';

        if (options.debug) {
            diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
        }

        if (!projectId || !ingestKey) {
            console.warn('[ReplayOS] Missing Project ID or Ingest Key. Telemetry is disabled.');
            return;
        }

        const url = options.ingestUrl || 'http://localhost:5000/api/traces/v1/traces';

        const exporter = new OTLPTraceExporter({
            url: url,
            headers: { 
                'x-project-id': projectId,
                'x-ingest-key': ingestKey
            }
        });

        sdk = new NodeSDK({
            traceExporter: exporter,
            serviceName: serviceName,
            instrumentations: [getNodeAutoInstrumentations()]
        });

        sdk.start();
        console.log(`[ReplayOS] 🕵️‍♂️ Observability initialized for: ${serviceName}`);
    },

    /**
     * Manually records an error to the current active span.
     */
    recordError: (error: Error | string) => {
        const activeSpan = trace.getActiveSpan();
        if (activeSpan) {
            activeSpan.setStatus({ code: SpanStatusCode.ERROR, message: typeof error === 'string' ? error : error.message });
            activeSpan.recordException(error);
        }
    },

    /**
     * Helper to get the tracer for manual span creation
     */
    getTracer: () => {
        return trace.getTracer('replayos-node-sdk');
    },

    /**
     * Ensures all pending traces are sent before the process exits.
     */
    shutdown: async () => {
        if (sdk) {
            await sdk.shutdown();
            console.log('[ReplayOS] SDK shut down successfully.');
        }
    }
};