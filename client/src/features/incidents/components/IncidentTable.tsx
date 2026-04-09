
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/context/auth';
import { useIncidents } from '../hooks/useIncidents'
import { useEffect } from 'react';


interface IncidentTableProps {
    projectId?: string; 
    onDataLoad?: (hasData: boolean) => void;
}


export default function IncidentTable({ onDataLoad }: IncidentTableProps) {
    const { activeProject } = useAuth();
    
    const navigate = useNavigate();


    const { incidents, isLoading, error } = useIncidents(activeProject?.id); 

    useEffect(() => {
        // Sirf tab trigger karo jab initial loading complete ho jaye
        if (!isLoading && onDataLoad) {
            onDataLoad(incidents.length > 0);
        }
    }, [incidents, isLoading, onDataLoad]);


    // Helper function to color-code the severity badges
    const getSeverityColor = (severity: string) => {
        switch (severity?.toLowerCase()) {
            case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted animate-pulse">Loading incidents...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-400">{error}</div>;
    }

    return (
        <div className="w-full">
            {incidents.length === 0 ? (
                <div className="p-8 text-center text-muted bg-surface/50 rounded-xl border border-surfaceBorder mt-4">
                    No incidents yet.
                </div>
            ):(
                <div className="w-full border border-surfaceBorder rounded-xl overflow-hidden bg-surface shadow-sm">
            <table className="w-full text-left text-sm">
                <thead className="bg-surfaceBorder/30 text-muted">
                    <tr>
                        <th className="px-6 py-4 font-medium">Incident Title</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium">Severity</th>
                        <th className="px-6 py-4 font-medium">Created</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-surfaceBorder/50">
                    {incidents.map((incident) => (
                        <tr key={incident.id} 
                            onClick={() => navigate(`/incident/${incident.id}`)}
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
                    {incidents.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-muted">
                                <div className="flex flex-col items-center justify-center">
                                    <AlertCircle size={32} className="mb-3 opacity-50" />
                                    <p>No incidents reported yet. You are safe!</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
            )}
        </div>
    );
}