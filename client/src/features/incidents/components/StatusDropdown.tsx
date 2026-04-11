import { useState } from 'react';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { incidentService } from '../api/incident.service';

interface StatusDropdownProps {
    incidentId: string;
    currentStatus: string;
    onStatusUpdate: (newStatus: string) => void;
}

const statuses = [
    { id: 'open', label: 'Open', color: 'text-red-500', bg: 'bg-red-500/10' },
    { id: 'in_progress', label: 'In Progress', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { id: 'resolved', label: 'Resolved', color: 'text-green-500', bg: 'bg-green-500/10' }
];

export default function StatusDropdown({ incidentId, currentStatus, onStatusUpdate }: StatusDropdownProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleUpdate = async (newStatus: string) => {
        if (newStatus === currentStatus) return;
        
        setIsUpdating(true);
        setIsOpen(false);
        try {
            await incidentService.updateStatus(incidentId, newStatus);
            onStatusUpdate(newStatus); // Parent state ko update karein
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update status. Check permissions.");
        } finally {
            setIsUpdating(false);
        }
    };

    const activeStatus = statuses.find(s => s.id === currentStatus) || statuses[0];

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                disabled={isUpdating}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-surfaceBorder font-medium text-sm transition-all hover:bg-surfaceBorder/30 ${activeStatus.bg} ${activeStatus.color}`}
            >
                {isUpdating ? <Loader2 size={16} className="animate-spin" /> : activeStatus.label}
                <ChevronDown size={14} className={isOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-surface border border-surfaceBorder rounded-xl shadow-2xl z-50 overflow-hidden">
                    {statuses.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => handleUpdate(s.id)}
                            className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-300 hover:bg-surfaceBorder/40 transition-colors"
                        >
                            <span className={s.color}>{s.label}</span>
                            {currentStatus === s.id && <Check size={14} className="text-primary" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}