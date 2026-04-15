// client/src/features/incidents/components/StatusDropdown.tsx
import { useState } from 'react';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { incidentService } from '../api/incident.service';

/**
 * Interface Definition
 * Defines the properties required to manage the lifecycle of an incident's status.
 */
interface StatusDropdownProps {
    incidentId: string;
    currentStatus: string;
    onStatusUpdate: (newStatus: string) => void;
}

// Configuration for available incident lifecycle states and their visual styles
const statuses = [
    { id: 'open', label: 'Open', color: 'text-red-500', bg: 'bg-red-500/10' },
    { id: 'in_progress', label: 'In Progress', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { id: 'resolved', label: 'Resolved', color: 'text-green-500', bg: 'bg-green-500/10' }
];

/**
 * StatusDropdown Component
 * An interactive selector that allows users to change an incident's state.
 * Handles API persistence and provides visual loading feedback during updates.
 */
export default function StatusDropdown({ incidentId, currentStatus, onStatusUpdate }: StatusDropdownProps) {
    // Local state to track API request flight and menu visibility
    const [isUpdating, setIsUpdating] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    /**
     * Updates the incident status via the backend service.
     * Prevents redundant updates and provides error feedback for permission issues.
     */
    const handleUpdate = async (newStatus: string) => {
        if (newStatus === currentStatus) return;

        setIsUpdating(true);
        setIsOpen(false);
        try {
            // Persists the status change to the server
            await incidentService.updateStatus(incidentId, newStatus);
            // Notifies parent component to refresh local data state
            onStatusUpdate(newStatus);
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update status. Check permissions.");
        } finally {
            setIsUpdating(false);
        }
    };

    // Identifies the active configuration based on the current incident state
    const activeStatus = statuses.find(s => s.id === currentStatus) || statuses[0];

    return (
        <div className="relative">
            {/* TRIGGER: The main button displaying the current status or a loading spinner */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                disabled={isUpdating}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-surfaceBorder font-medium text-sm transition-all hover:bg-surfaceBorder/30 ${activeStatus.bg} ${activeStatus.color}`}
            >
                {isUpdating ? <Loader2 size={16} className="animate-spin" /> : activeStatus.label}
                <ChevronDown size={14} className={isOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>

            {/* DROPDOWN MENU: List of selectable status options */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-surface border border-surfaceBorder rounded-xl shadow-2xl z-50 overflow-hidden">
                    {statuses.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => handleUpdate(s.id)}
                            className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-300 hover:bg-surfaceBorder/40 transition-colors"
                        >
                            <span className={s.color}>{s.label}</span>
                            {/* Visual indicator for the currently active status */}
                            {currentStatus === s.id && <Check size={14} className="text-primary" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}