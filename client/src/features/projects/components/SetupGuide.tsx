// client/src/features/projects/components/SetupGuide.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, CheckCircle2, Terminal, Code2, X } from 'lucide-react';

/**
 * Interface Definition
 * projectId: The unique identifier for the project workspace.
 * ingestKey: The security credential required for trace authentication.
 * ingestUrl: The endpoint where the SDK transmits OpenTelemetry data.
 * onClose: Callback function to dismiss the setup modal.
 */
interface SetupGuideProps {
    projectId: string;
    ingestKey: string;
    ingestUrl?: string;
    onClose: () => void;
}

/**
 * SetupGuide Component
 * Provides an interactive, multi-language walkthrough for instrumenting 
 * applications with the ReplayOS SDK.
 */
export default function SetupGuide({ 
    projectId,
    ingestKey,
    ingestUrl = 'http://localhost:5000/api/traces/v1/traces',
    onClose
}: SetupGuideProps) {
    // Local state to manage active documentation tab and clipboard feedback
    const [activeTab, setActiveTab] = useState<'node' | 'python'>('node');
    const [copied, setCopied] = useState(false);

    // Configuration object containing the boilerplate code for different runtime environments
    const codeSnippets = {
        node: `// 1. Install the ReplayOS SDK directly from our GitHub repo
// npm install github:Arjun586/ReplayOS#path:packages/node-sdk

const { ReplayOS } = require('@replayos/node');

// 2. Initialize the SDK at the top of your main file (e.g., index.js)
ReplayOS.init({
    projectId: '${projectId}',
    ingestKey: '${ingestKey}', // Secured key from Project Settings
    serviceName: 'my-production-api',
    ingestUrl: '${ingestUrl}'
});`,
        python: `# Python SDK documentation coming soon. 
# ReplayOS supports OpenTelemetry standard ingestion.`
    };

    /**
     * Copies the active code snippet to the system clipboard.
     * Provides transient visual feedback to confirm the action.
     */
    const handleCopy = () => {
        navigator.clipboard.writeText(codeSnippets[activeTab]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            {/* Animated Modal Container */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-3xl bg-surface border border-surfaceBorder rounded-xl overflow-hidden shadow-2xl relative"
            >
                {/* Close trigger for dismissing the guide */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 text-muted hover:text-white hover:bg-surfaceBorder/50 rounded-lg transition-colors z-10"
                >
                    <X size={20} />
                </button>

                {/* Header: Instruction and branding */}
                <div className="p-6 border-b border-surfaceBorder bg-surfaceBorder/10 pr-12">
                    <h3 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                        <Terminal size={20} className="text-primary" /> 
                        Instrument Your Codebase
                    </h3>
                    <p className="text-muted mt-2 text-sm">
                        Configure OpenTelemetry in your application to start capturing traces.
                    </p>
                </div>

                <div className="p-6">
                    {/* Tab Navigation: Switches between supported SDK environments */}
                    <div className="flex items-center gap-4 mb-4">
                        <button
                            onClick={() => setActiveTab('node')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                                activeTab === 'node' 
                                ? 'bg-primary/20 text-primary border border-primary/50' 
                                : 'bg-background text-muted border border-surfaceBorder hover:bg-surfaceBorder/30'
                            }`}
                        >
                            <Code2 size={16} /> Node.js
                        </button>
                        <button
                            onClick={() => setActiveTab('python')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                                activeTab === 'python' 
                                ? 'bg-primary/20 text-primary border border-primary/50' 
                                : 'bg-background text-muted border border-surfaceBorder hover:bg-surfaceBorder/30'
                            }`}
                        >
                            <Code2 size={16} /> Python
                        </button>
                    </div>

                    {/* Code Display: Pre-formatted block with integrated copy-to-clipboard functionality */}
                    <div className="relative group">
                        <div className="absolute top-4 right-4 z-10">
                            <button 
                                onClick={handleCopy}
                                className="p-2 bg-surfaceBorder/80 hover:bg-surfaceBorder text-gray-300 rounded-md transition-colors flex items-center gap-2 border border-white/5"
                            >
                                {copied ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} />}
                                <span className="text-xs font-mono">{copied ? 'Copied!' : 'Copy'}</span>
                            </button>
                        </div>
                        
                        <pre className="bg-[#0d1117] p-6 rounded-lg border border-surfaceBorder overflow-x-auto max-h-[300px]">
                            <code className="text-sm font-mono text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {codeSnippets[activeTab]}
                            </code>
                        </pre>
                    </div>
                    
                    {/* Status Indicator: Confirming the workspace is ready for telemetry ingestion */}
                    <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                            <div className="mt-1">
                                <span className="flex h-2.5 w-2.5 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                                </span>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-blue-400">Listening for traces</h4>
                                <p className="text-xs text-blue-400/80 mt-1">
                                    Project ID: <span className="font-mono text-white bg-black/20 px-1 py-0.5 rounded">{projectId}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}