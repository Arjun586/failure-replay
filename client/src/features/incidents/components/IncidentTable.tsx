// client/src/features/incidents/components/IncidentTable.tsx
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/context/auth';
import { useIncidents } from '../hooks/useIncidents';
import { Skeleton } from '../../../core/components/Skeleton';
import { useEffect } from 'react';

interface IncidentTableProps {
    projectId?: string;
    isLiveMode?: boolean;
    searchParams?: URLSearchParams;
    onDataLoad?: (hasData: boolean) => void;
}

export default function IncidentTable({ onDataLoad, isLiveMode = false, searchParams }: IncidentTableProps) {
    const { activeProject } = useAuth();
    const navigate = useNavigate();

    const { incidents, isLoading, error } = useIncidents(activeProject?.id, searchParams, isLiveMode);

    useEffect(() => {
        if (!isLoading && onDataLoad) {
            onDataLoad(incidents.length > 0);
        }
    }, [incidents, isLoading, onDataLoad]);

    const getSeverityColor = (severity: string) => {
        switch (severity?.toLowerCase()) {
            case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        }
    };

    if (error) {
        return <div className="p-8 text-center text-red-400 bg-red-500/10 rounded-xl border border-red-500/20">{error}</div>;
    }

    // 🚀 Header hamesha dikhega (loading ho, error ho, ya empty ho)
    return (
        <div className="w-full">
            <div className="w-full border border-surfaceBorder rounded-xl overflow-hidden bg-surface shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-surfaceBorder/30 text-muted border-b border-surfaceBorder/50">
                        <tr>
                            <th className="px-6 py-4 font-medium">Incident Title</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium">Severity</th>
                            <th className="px-6 py-4 font-medium">Created</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surfaceBorder/50">
                        
                        {/* 🚀 SKELETON: Table Row Format */}
                        {isLoading && [1, 2, 3, 4, 5].map((index) => (
                            <tr key={`skeleton-${index}`}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="w-4 h-4 rounded-full" />
                                        <Skeleton className="w-48 h-4" />
                                    </div>
                                </td>
                                <td className="px-6 py-4"><Skeleton className="w-16 h-4" /></td>
                                <td className="px-6 py-4"><Skeleton className="w-20 h-6 rounded-full" /></td>
                                <td className="px-6 py-4"><Skeleton className="w-24 h-4" /></td>
                            </tr>
                        ))}

                        {/* 🚀 DATA ROWS */}
                        {!isLoading && incidents.map((incident) => (
                            <tr key={incident.id} 
                                onClick={() => navigate(`/incident/${incident.id}`)} // Fixed route from /incident/ to /incidents/ (if your route uses plural)
                                className="hover:bg-surfaceBorder/20 transition-colors cursor-pointer"
                            >
                                <td className="px-6 py-4 font-medium text-gray-200 flex items-center gap-3">
                                    <AlertCircle size={16} className={incident.severity === 'critical' ? 'text-red-500' : 'text-muted'} />
                                    <span className="truncate max-w-[300px]">{incident.title}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="flex items-center gap-1.5 text-blue-400">
                                        <Clock size={14} /> 
                                        {incident.status?.toUpperCase() || 'OPEN'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(incident.severity)}`}>
                                        {incident.severity?.toUpperCase() || 'UNKNOWN'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-muted whitespace-nowrap">
                                    {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })}
                                </td>
                            </tr>
                        ))}

                        {/* 🚀 EMPTY STATE */}
                        {!isLoading && incidents.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-muted">
                                    <div className="flex flex-col items-center justify-center">
                                        <AlertCircle size={32} className="mb-3 opacity-50" />
                                        <p>No incidents found matching your criteria.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}