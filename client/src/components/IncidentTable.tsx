// client/src/components/IncidentTable.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Clock } from 'lucide-react';

// Tell TypeScript exactly what our data looks like
type Incident = {
    id: string;
    title: string;
    status: string;
    severity: string;
    createdAt: string;
};

export default function IncidentTable() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    //TODO: : can we seprate this ?
    //  Fetch data from our Express backend when the component loads
    useEffect(() => {
        const fetchIncidents = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/incidents');
            setIncidents(response.data.data);
        } catch (error) {
            console.error("Failed to fetch incidents", error);
        } finally {
            setIsLoading(false);
        }
        };

        fetchIncidents();
    }, []);

  // Helper function to color-code the severity badges
    const getSeverityColor = (severity: string) => {
        switch (severity) {
        case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
        case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
        case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        }
    };

    if (isLoading) {
        return <div className="text-muted animate-pulse">Loading incidents...</div>;
    }

    return (
        <div className="w-full border border-surfaceBorder rounded-xl overflow-hidden bg-surface">
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
                    <tr key={incident.id} className="hover:bg-surfaceBorder/20 transition-colors cursor-pointer">
                    <td className="px-6 py-4 font-medium text-gray-200 flex items-center gap-3">
                        <AlertCircle size={16} className="text-muted" />
                        {incident.title}
                    </td>
                    <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-blue-400">
                        <Clock size={14} /> {incident.status.toUpperCase()}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(incident.severity)}`}>
                        {incident.severity.toUpperCase()}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-muted">
                        {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })}
                    </td>
                    </tr>
                ))}
                {incidents.length === 0 && (
                    <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted">
                        No incidents reported yet. You are safe!
                    </td>
                    </tr>
                )}
            </tbody>
        </table>
        </div>
    );
}