// client/src/features/dashboard/pages/Settings.tsx
import { Copy, CheckCircle2, Palette, KeyRound } from 'lucide-react';
import { useAuth } from '../../../core/context/auth';
import { useTheme } from '../../../core/context/theme';
import { useState } from 'react';

export default function Settings() {
    const { activeProject } = useAuth();
    const { theme, setTheme } = useTheme();
    const [copied, setCopied] = useState(false);

    // Mock ingest key since it's not exposed in your standard project payload yet, 
    // but Prisma schema shows Project has 'ingestKey'
    const ingestKey = activeProject?.id ? `${activeProject.id}-secret-key` : 'No project selected';

    const handleCopy = () => {
        navigator.clipboard.writeText(ingestKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const themes = [
        { id: 'purple', label: 'Amethyst Purple', color: 'bg-[#8b5cf6]' },
        { id: 'blue', label: 'Ocean Blue', color: 'bg-[#3b82f6]' },
        { id: 'red', label: 'Crimson Red', color: 'bg-[#ef4444]' },
        { id: 'gray', label: 'Monochrome Gray', color: 'bg-[#d4d4d8]' },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-gray-100 tracking-tight">Project Settings</h2>
                <p className="text-muted mt-1">Manage API keys and workspace preferences.</p>
            </header>

            <div className="space-y-6">
                {/* API Keys Section */}
                <div className="bg-surface border border-surfaceBorder rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-surfaceBorder bg-surfaceBorder/10 flex items-center gap-3">
                        <KeyRound className="text-primary" size={20} />
                        <h3 className="font-bold text-gray-100">API Integration</h3>
                    </div>
                    <div className="p-6">
                        <p className="text-sm text-muted mb-4">Use this Ingest Key in your OpenTelemetry headers to securely route traces to this project.</p>
                        <div className="flex items-center gap-3 bg-[#09090b] border border-surfaceBorder rounded-lg p-2 max-w-lg">
                            <input type="text" readOnly value={ingestKey} className="flex-1 bg-transparent text-sm font-mono text-gray-300 px-2 focus:outline-none" />
                            <button onClick={handleCopy} className="px-3 py-1.5 bg-surfaceBorder hover:bg-surfaceBorder/80 text-gray-200 rounded-md transition-colors text-sm font-medium flex items-center gap-2">
                                {copied ? <CheckCircle2 size={14} className="text-green-500"/> : <Copy size={14} />}
                                {copied ? 'Copied' : 'Copy Key'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Appearance Section */}
                <div className="bg-surface border border-surfaceBorder rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-surfaceBorder bg-surfaceBorder/10 flex items-center gap-3">
                        <Palette className="text-primary" size={20} />
                        <h3 className="font-bold text-gray-100">Appearance</h3>
                    </div>
                    <div className="p-6">
                        <p className="text-sm text-muted mb-6">Customize the look and feel of your Failure Replay workspace.</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {themes.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTheme(t.id as any)}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === t.id ? 'border-primary bg-primary/5' : 'border-surfaceBorder bg-background hover:border-gray-500'}`}
                                >
                                    <span className={`w-8 h-8 rounded-full ${t.color} mb-3 shadow-lg`}></span>
                                    <span className={`text-sm font-medium ${theme === t.id ? 'text-primary' : 'text-gray-300'}`}>{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}