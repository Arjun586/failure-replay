import React, { useState } from 'react';
import { motion} from 'framer-motion';
import { Copy, CheckCircle2, Terminal, Code2,  X } from 'lucide-react';

interface SetupGuideProps {
    projectId: string;
    ingestUrl?: string; 
    onClose: () => void; // 👈 Naya prop modal close karne ke liye
}

export default function SetupGuide({ 
    projectId, 
    ingestUrl = 'http://localhost:5000/api/traces/v1/traces',
    onClose
}: SetupGuideProps) {
    const [activeTab, setActiveTab] = useState<'node' | 'python'>('node');
    const [copied, setCopied] = useState(false);

    // ... (Tumhara same codeSnippets object yahan rahega) ...
    const codeSnippets = {
node: `// 1. Install the ReplayOS SDK directly from our GitHub repo
    // npm install github:Arjun586/failure-replay#path:packages/node-sdk

    const { ReplayOS } = require('@replayos/node');

    // 2. Initialize the SDK at the top of your main file (e.g., index.js)
    ReplayOS.init({
    projectId: '${projectId}',
    ingestKey: 'your-project-ingest-key', // Retrieve this from Project Settings
    serviceName: 'my-production-api',
    ingestUrl: '${ingestUrl}'
    });`
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(codeSnippets[activeTab]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        // 🚀 FULL SCREEN MODAL OVERLAY
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-3xl bg-surface border border-surfaceBorder rounded-xl overflow-hidden shadow-2xl relative"
            >
                {/* 🚀 CLOSE BUTTON */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 text-muted hover:text-white hover:bg-surfaceBorder/50 rounded-lg transition-colors z-10"
                >
                    <X size={20} />
                </button>

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