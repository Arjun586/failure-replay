
import { FileText, FileSearch } from 'lucide-react';
import { useAuth } from '../../../core/context/auth';
import { useIncidents } from '../hooks/useIncidents';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function Postmortems() {
    const { activeProject } = useAuth();
    const { incidents, isLoading } = useIncidents(activeProject?.id);
    const navigate = useNavigate();

    // In a real app, you might only show "resolved" incidents here.
    // For now, we'll show all of them but style them as documents.
    const documents = incidents; 

    if (isLoading) return <div className="p-8 text-center text-muted animate-pulse">Loading documents...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-gray-100 tracking-tight flex items-center gap-3">
                    <FileText className="text-primary" size={28} /> Postmortem Library
                </h2>
                <p className="text-muted mt-2">Generate and review markdown reports for past incidents.</p>
            </header>

            {documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 border border-surfaceBorder border-dashed rounded-2xl bg-surface/30">
                    <FileSearch size={48} className="text-muted mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold text-gray-300">No Postmortems Yet</h3>
                    <p className="text-muted mt-2 text-center max-w-sm">When you resolve incidents, you can generate and view their postmortem reports here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {documents.map((doc) => (
                        <div 
                            key={doc.id} 
                            onClick={() => navigate(`/incident/${doc.id}`)}
                            className="bg-surface border border-surfaceBorder hover:border-primary/50 rounded-xl p-5 cursor-pointer group transition-all hover:-translate-y-1 hover:shadow-lg"
                        >
                            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <FileText size={20} />
                            </div>
                            <h3 className="font-bold text-gray-100 line-clamp-2 mb-2">{doc.title}</h3>
                            <div className="flex items-center justify-between mt-6 border-t border-surfaceBorder pt-4">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${doc.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-surfaceBorder text-muted'}`}>
                                    {doc.severity}
                                </span>
                                <span className="text-xs text-muted font-mono">
                                    {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}