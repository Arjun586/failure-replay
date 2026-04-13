"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReplayOS = void 0;
const sdk_node_1 = require("@opentelemetry/sdk-node");
const exporter_trace_otlp_http_1 = require("@opentelemetry/exporter-trace-otlp-http");
const auto_instrumentations_node_1 = require("@opentelemetry/auto-instrumentations-node");
// 1. Import the diagnostic tools
const api_1 = require("@opentelemetry/api");
exports.ReplayOS = {
    init: (options) => {
        // 3. If debug is true, force OTEL to log all internal errors
        if (options.debug) {
            api_1.diag.setLogger(new api_1.DiagConsoleLogger(), api_1.DiagLogLevel.DEBUG);
        }
        const url = options.ingestUrl || 'http://127.0.0.1:5000/api/traces/v1/traces';
        const exporter = new exporter_trace_otlp_http_1.OTLPTraceExporter({
            url: url,
            headers: {
                'x-project-id': options.projectId,
                'x-ingest-key': options.ingestKey
            }
        });
        const sdk = new sdk_node_1.NodeSDK({
            traceExporter: exporter,
            serviceName: options.serviceName,
            instrumentations: [(0, auto_instrumentations_node_1.getNodeAutoInstrumentations)()]
        });
        sdk.start();
        console.log(`[ReplayOS] Tracing initialized for ${options.serviceName}`);
    }
};
