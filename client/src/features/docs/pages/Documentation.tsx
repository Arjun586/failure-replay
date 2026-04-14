import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Terminal, Code2, Server, FileText } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';

const docsContent = {
    'getting-started': `
# Getting Started with ReplayOS

Welcome to **ReplayOS**. This platform ingests raw backend logs, OpenTelemetry traces, and bug reports, parsing them asynchronously to reconstruct complex system failures into visual, playable timelines.

## Core Concepts
* **Traces:** The complete journey of a request across all your microservices.
* **Spans:** An individual operation within a trace (e.g., a database query or an API call).
* **Incidents:** Clustered failure events (Errors/Exceptions) grouped intelligently by ReplayOS to prevent alert fatigue.

## Next Steps
Head over to the **SDK Setup** section to instrument your first application!
    `,
    'node-sdk': `
# Node.js SDK Integration

The official ReplayOS Node SDK provides zero-config OpenTelemetry tracing with advanced manual instrumentation capabilities.

## 1. Installation

\`\`\`bash
npm i @replayos/node
\`\`\`

## 2. Initialization

Initialize the SDK at the very top of your application's entry file. It automatically detects environment variables (\`REPLAYOS_PROJECT_ID\`, \`REPLAYOS_INGEST_KEY\`, \`SERVICE_NAME\`).

\`\`\`javascript
const { ReplayOS } = require('@replayos/node');

ReplayOS.init({
    // Fallbacks if env vars are missing
    projectId: 'YOUR_PROJECT_ID',     
    ingestKey: 'YOUR_INGEST_KEY',     
    serviceName: 'payment-gateway',
    ingestUrl: 'http://localhost:5000/api/traces/v1/traces' 
});
\`\`\`

## 3. Manual Error Tracking
Capture handled exceptions specifically in your timeline:
\`\`\`javascript
try {
    await processPayment();
} catch (err) {
    ReplayOS.recordError(err);
    throw err;
}
\`\`\`

## 4. Graceful Shutdown
Ensure all traces are flushed before the server closes:
\`\`\`javascript
process.on('SIGINT', async () => {
    await ReplayOS.shutdown();
    process.exit(0);
});
\`\`\`
    `,
    'architecture': `
# System Architecture

ReplayOS is designed using a decoupled, horizontally scalable architecture to handle heavy telemetry loads.

1. **Presentation Layer (React/Vite):** An Optimistic UI for high-density data visualization.
2. **API Gateway (Express):** Stateless REST API acting as the central traffic router.
3. **Asynchronous Pipeline:** Background workers extract timestamps, severity levels, and correlation IDs.
4. **Data Layer (PostgreSQL):** Enforces strict referential integrity between Organizations, Projects, Incidents, and Traces.
    `
};

type DocSection = keyof typeof docsContent;

export default function Documentation() {
    const [activeSection, setActiveSection] = useState<DocSection>('getting-started');

    // Reset scroll position when switching tabs
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeSection]);

    const menuItems: { id: DocSection; label: string; icon: React.ElementType }[] = [
        { id: 'getting-started', label: 'Getting Started', icon: BookOpen },
        { id: 'node-sdk', label: 'Node.js SDK', icon: Terminal },
        { id: 'architecture', label: 'System Architecture', icon: Server },
    ];

    return (
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 pb-12 p-6">
            
            {/* Left Sidebar - Navigation */}
            <aside className="w-full md:w-64 shrink-0">
                <div className="sticky top-6 space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2 mb-6">
                            <FileText className="text-primary" size={24} /> 
                            Documentation
                        </h2>
                        <nav className="flex flex-col gap-2">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    aria-current={activeSection === item.id ? 'page' : undefined}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        activeSection === item.id 
                                            ? 'bg-primary/10 border border-primary/30 text-primary shadow-sm' 
                                            : 'bg-surface border border-surfaceBorder text-gray-400 hover:text-gray-200 hover:bg-surfaceBorder/30'
                                    }`}
                                >
                                    <item.icon size={18} className={activeSection === item.id ? "text-primary" : "text-muted"} />
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                        <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2 mb-2">
                            <Code2 size={16} /> Pro Tip
                        </h4>
                        <p className="text-xs text-blue-400/80 leading-relaxed">
                            Need your API credentials? Head over to the Settings tab to grab your Project ID and Ingest Key.
                        </p>
                    </div>
                </div>
            </aside>

            {/* Right Side - Markdown Content */}
            <motion.main 
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex-1 bg-surface border border-surfaceBorder rounded-2xl overflow-hidden shadow-sm min-h-[600px]"
            >
                <div className="p-8 md:p-12" data-color-mode="dark">
                    <MDEditor.Markdown 
                        source={docsContent[activeSection]} 
                        style={{ backgroundColor: 'transparent', color: '#e5e7eb' }}
                        className="prose prose-invert max-w-none prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-surfaceBorder prose-headings:text-gray-100 prose-a:text-primary"
                    />
                </div>
            </motion.main>
            
        </div>
    );
}