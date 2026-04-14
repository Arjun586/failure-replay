"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReplayOS = void 0;
// packages/node-sdk/src/index.ts
const sdk_node_1 = require("@opentelemetry/sdk-node");
const exporter_trace_otlp_http_1 = require("@opentelemetry/exporter-trace-otlp-http");
const auto_instrumentations_node_1 = require("@opentelemetry/auto-instrumentations-node");
const api_1 = require("@opentelemetry/api");
let sdk = null;
exports.ReplayOS = {
    /**
     * Initializes the ReplayOS SDK.
     * Will automatically pick up credentials from environment variables if not provided.
     */
    init: (options = {}) => {
        const projectId = options.projectId || process.env.REPLAYOS_PROJECT_ID;
        const ingestKey = options.ingestKey || process.env.REPLAYOS_INGEST_KEY;
        const serviceName = options.serviceName || process.env.REPLAYOS_SERVICE_NAME || 'unnamed-service';
        if (options.debug) {
            api_1.diag.setLogger(new api_1.DiagConsoleLogger(), api_1.DiagLogLevel.DEBUG);
        }
        if (!projectId || !ingestKey) {
            console.warn('[ReplayOS] Missing Project ID or Ingest Key. Telemetry is disabled.');
            return;
        }
        const url = options.ingestUrl || 'http://localhost:5000/api/traces/v1/traces';
        const exporter = new exporter_trace_otlp_http_1.OTLPTraceExporter({
            url: url,
            headers: {
                'x-project-id': projectId,
                'x-ingest-key': ingestKey
            }
        });
        sdk = new sdk_node_1.NodeSDK({
            traceExporter: exporter,
            serviceName: serviceName,
            instrumentations: [(0, auto_instrumentations_node_1.getNodeAutoInstrumentations)()]
        });
        sdk.start();
        console.log(`[ReplayOS] 🕵️‍♂️ Observability initialized for: ${serviceName}`);
    },
    /**
     * Manually records an error to the current active span.
     */
    recordError: (error) => {
        const activeSpan = api_1.trace.getActiveSpan();
        if (activeSpan) {
            activeSpan.setStatus({ code: api_1.SpanStatusCode.ERROR, message: typeof error === 'string' ? error : error.message });
            activeSpan.recordException(error);
        }
    },
    /**
     * Helper to get the tracer for manual span creation
     */
    getTracer: () => {
        return api_1.trace.getTracer('replayos-node-sdk');
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
