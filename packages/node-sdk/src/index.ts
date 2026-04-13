import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

export interface ReplayOSOptions {
    projectId: string;
    ingestKey: string;
    serviceName: string;
    ingestUrl?: string; 
}

export const ReplayOS = {
    init: (options: ReplayOSOptions) => {
        const url = options.ingestUrl || 'http://localhost:5000/api/traces/v1/traces';

        const exporter = new OTLPTraceExporter({
        url: url,
        headers: { 
            'x-project-id': options.projectId,
            'x-ingest-key': options.ingestKey
        }
        });
        
        const sdk = new NodeSDK({
        traceExporter: exporter,
        serviceName: options.serviceName
        });

        sdk.start();
        console.log(`[ReplayOS] Tracing initialized for ${options.serviceName}`);
    }
};