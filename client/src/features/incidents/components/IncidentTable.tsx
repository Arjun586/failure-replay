// client/src/features/incidents/components/IncidentTable.tsx
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Clock, CheckCircle2, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/context/auth';
import { useIncidents } from '../hooks/useIncidents';
import { Skeleton } from '../../../core/components/Skeleton';
import { useEffect } from 'react';

// Defines the data requirements for the incident list display
interface IncidentTableProps {
    projectId?: string;
    isLiveMode?: boolean;
    searchParams?: URLSearchParams;
    onDataLoad?: (hasData: boolean) => void;
}

/**
 * IncidentTable Component
 * Renders a structured data table of platform incidents with dynamic styling 
 * for status and severity. Supports skeleton loading states and live updates.
 */
export default function IncidentTable({ onDataLoad, isLiveMode = false, searchParams }: IncidentTableProps) {
    const { activeProject } = useAuth();
    const navigate = useNavigate();

    // Custom hook to fetch incident data based on project context and filter parameters
    const { incidents, isLoading, error } = useIncidents(activeProject?.id, searchParams, isLiveMode);

    // Notifies parent components of the data availability status once loading completes
    useEffect(() => {
        if (!isLoading && onDataLoad) {
            onDataLoad(incidents.length > 0);
        }
    }, [incidents, isLoading, onDataLoad]);

    /**
     * Maps severity levels to specific CSS color classes for visual priority.
     */
    const getSeverityColor = (severity: string) => {
        switch (severity?.toLowerCase()) {
            case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        }
    };

    /**
     * Returns a configuration object for status-specific styling and iconography.
     */
    const getStatusStyles = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'resolved': 
                return { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/20', icon: <CheckCircle2 size={14} /> };
            case 'in_progress': 
                return { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/20', icon: <Activity size={14} /> };
            case 'open':
            default: 
                return { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20', icon: <Clock size={14} /> };
        }
    };

    // Displays a dedicated error banner if the data fetch fails
    if (error) {
        return <div className="p-8 text-center text-red-400 bg-red-500/10 rounded-xl border border-red-500/20">{error}</div>;
    }

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
                        
                        {/* SKELETON: Displayed during data fetch to prevent layout shift */}
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

                        {/* DATA ROWS: Interactive rows that navigate to detailed incident reports */}
                        {!isLoading && incidents.map((incident) => {
                            const statusStyle = getStatusStyles(incident.status); 
                            
                            return (
                                <tr key={incident.id} 
                                    onClick={() => navigate(`/incident/${incident.id}`)}
                                    className="hover:bg-surfaceBorder/20 transition-colors cursor-pointer"
                                >
                                    <td className="px-6 py-4 font-medium text-gray-200 flex items-center gap-3">
                                        {incident.status === 'resolved' ? (
                                            <CheckCircle2 size={16} className="text-green-500" />
                                        ) : incident.status === 'in_progress' ? (
                                            <Activity size={16} className="text-yellow-500" />
                                        ) : (
                                            <AlertCircle size={16} className={incident.severity === 'critical' ? 'text-red-500' : 'text-muted'} />
                                        )}
                                        <span className="truncate max-w-[300px]">{incident.title}</span>
                                    </td>
                
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                            {statusStyle.icon} 
                                            {incident.status?.replace('_', ' ').toUpperCase() || 'OPEN'}
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
                            );
                        })}

                        {/* EMPTY STATE: Visual feedback when no results match active filters */}
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