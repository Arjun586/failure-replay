export interface ReplayOSOptions {
    projectId: string;
    ingestKey: string;
    serviceName: string;
    ingestUrl?: string;
    debug?: boolean;
}
export declare const ReplayOS: {
    init: (options: ReplayOSOptions) => void;
};
