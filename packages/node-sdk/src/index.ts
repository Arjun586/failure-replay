import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
// 1. Import the diagnostic tools
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

export interface ReplayOSOptions {
    projectId: string;
    ingestKey: string;
    serviceName: string;
    ingestUrl?: string; 
    debug?: boolean; // 2. Add a debug flag
}

export const ReplayOS = {
    init: (options: ReplayOSOptions) => {
        
        // 3. If debug is true, force OTEL to log all internal errors
        if (options.debug) {
            diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
        }

        const url = options.ingestUrl || 'http://127.0.0.1:5000/api/traces/v1/traces';

        const exporter = new OTLPTraceExporter({
            url: url,
            headers: { 
                'x-project-id': options.projectId,
                'x-ingest-key': options.ingestKey
            }
        });

        const sdk = new NodeSDK({
            traceExporter: exporter,
            serviceName: options.serviceName,
            instrumentations: [getNodeAutoInstrumentations()]
        });

        sdk.start();
        console.log(`[ReplayOS] Tracing initialized for ${options.serviceName}`);
    }
};