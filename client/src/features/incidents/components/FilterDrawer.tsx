// client/src/features/incidents/components/FilterDrawer.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, AlertCircle, Server, Activity } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../core/context/auth'; 
import { apiClient } from '../../../core/api/client';
import { Skeleton } from '../../../core/components/Skeleton';

interface FilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * FilterDrawer Component
 * A slide-out panel that manages incident filtering via URL search parameters.
 * Supports keyword searching, severity/status toggling, and dynamic service filtering.
 */
export default function FilterDrawer({ isOpen, onClose }: FilterDrawerProps) {
    const [searchParams, setSearchParams] = useSearchParams();
    const { activeProject } = useAuth();
    
    // State for managing dynamically fetched microservice names
    const [availableServices, setAvailableServices] = useState<string[]>([]);
    const [isLoadingServices, setIsLoadingServices] = useState(false);

    /**
     * Effect: Fetches unique service names for the active project when the drawer opens.
     * Prevents redundant API calls by checking if data is already present.
     */
    useEffect(() => {
        let isMounted = true;

        const fetchServices = async () => {
            if (!activeProject?.id) return;
            
            setIsLoadingServices(true);
            try {
                const res = await apiClient.get(`/projects/${activeProject.id}/services`);
                if (isMounted) {
                    setAvailableServices(res.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch services", err);
            } finally {
                if (isMounted) {
                    setIsLoadingServices(false);
                }
            }
        };

        if (isOpen && activeProject?.id && availableServices.length === 0) {
            fetchServices();
        }

        return () => {
            isMounted = false;
        };
    }, [isOpen, activeProject?.id]);

    /**
     * Toggles a specific filter value in a comma-separated URL parameter list.
     * If the value exists, it is removed; otherwise, it is appended.
     */
    const toggleParam = (key: string, value: string) => {
        const current = searchParams.get(key) ? searchParams.get(key)!.split(',') : [];
        const updated = current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value];

        if (updated.length === 0) {
            searchParams.delete(key);
        } else {
            searchParams.set(key, updated.join(','));
        }
        setSearchParams(searchParams, { replace: true });
    };

    /**
     * Resets all active filters by clearing the URL search parameters.
     */
    const clearFilters = () => {
        setSearchParams(new URLSearchParams(), { replace: true });
    };

    // Tracks total active filter categories for the badge indicator
    const activeFilterCount = Array.from(searchParams.keys()).length;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* BACKDROP: Semi-transparent overlay to close the drawer on click */}
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                    />

                    {/* DRAWER: Animated side panel containing filter controls */}
                    <motion.div 
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-screen w-full sm:w-96 bg-surface border-l border-surfaceBorder shadow-2xl z-50 flex flex-col"
                    >
                        {/* HEADER: Title, active count badge, and close button */}
                        <div className="flex items-center justify-between p-5 border-b border-surfaceBorder bg-surface/50">
                            <div className="flex items-center gap-2">
                                <Filter size={18} className="text-primary" />
                                <h2 className="font-bold text-gray-100">Filters</h2>
                                {activeFilterCount > 0 && (
                                    <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </div>
                            <button onClick={onClose} className="p-1.5 text-muted hover:text-white rounded-lg hover:bg-surfaceBorder/50 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            
                            {/* SEARCH: Text-based filtering for errors or IDs */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-muted uppercase tracking-wider">Search Content</label>
                                <input 
                                    type="text"
                                    placeholder="Search errors, correlation IDs..."
                                    value={searchParams.get('search') || ''}
                                    onChange={(e) => {
                                        if (e.target.value) searchParams.set('search', e.target.value);
                                        else searchParams.delete('search');
                                        setSearchParams(searchParams, { replace: true });
                                    }}
                                    className="w-full bg-[#18181b] border border-surfaceBorder rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>

                            {/* SEVERITY: Multi-select buttons for incident criticality */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                                    <AlertCircle size={14} /> Severity
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['critical', 'high', 'medium', 'low'].map(sev => {
                                        const isActive = searchParams.get('severity')?.split(',').includes(sev);
                                        return (
                                            <button 
                                                key={sev} onClick={() => toggleParam('severity', sev)}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all text-left flex items-center gap-2
                                                    ${isActive ? 'bg-primary/10 border-primary text-primary' : 'bg-[#18181b] border-surfaceBorder text-gray-400 hover:text-gray-200'}
                                                `}
                                            >
                                                <div className={`w-2 h-2 rounded-full ${sev === 'critical' ? 'bg-red-500' : sev === 'high' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                                                {sev.charAt(0).toUpperCase() + sev.slice(1)}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* STATUS: Categorical filtering for incident lifecycle */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                                    <Activity size={14} /> Incident Status
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['open', 'in_progress', 'resolved'].map(stat => {
                                        const isActive = searchParams.get('status')?.split(',').includes(stat);
                                        let dotColor = stat === 'open' ? 'bg-red-500' : stat === 'in_progress' ? 'bg-yellow-500' : 'bg-green-500';

                                        return (
                                            <button 
                                                key={stat} onClick={() => toggleParam('status', stat)}
                                                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all text-center flex flex-col items-center gap-1.5
                                                    ${isActive ? 'bg-primary/10 border-primary text-primary' : 'bg-[#18181b] border-surfaceBorder text-gray-400 hover:text-gray-200'}
                                                `}
                                            >
                                                <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                                                {stat === 'in_progress' ? 'In Progress' : stat.charAt(0).toUpperCase() + stat.slice(1)}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                            
                            {/* SERVICES: Dynamic checkbox list of all microservices reporting telemetry */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                                    <Server size={14} /> Impacted Services
                                </label>
                                
                                {isLoadingServices ? (
                                    <div className="space-y-3 mt-2">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-center gap-3 p-1">
                                                <Skeleton className="w-4 h-4 rounded" /> 
                                                <Skeleton className="w-32 h-4" />
                                            </div>
                                        ))}
                                    </div>
                                ) : availableServices.length === 0 ? (
                                    <p className="text-sm text-muted">No services found.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {availableServices.map(svc => {
                                            const isActive = searchParams.get('service')?.split(',').includes(svc);
                                            return (
                                                <label key={svc} className="flex items-center gap-3 cursor-pointer group p-1">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isActive || false}
                                                        onChange={() => toggleParam('service', svc)}
                                                        className="w-4 h-4 rounded border-surfaceBorder text-primary focus:ring-primary bg-[#18181b]" 
                                                    />
                                                    <span className={`text-sm font-mono transition-colors ${isActive ? 'text-gray-200' : 'text-muted group-hover:text-gray-300'}`}>
                                                        {svc}
                                                    </span>
                                                </label>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* FOOTER: Global actions to clear or apply filters */}
                        <div className="p-5 border-t border-surfaceBorder bg-surfaceBorder/10 flex gap-3">
                            <button onClick={clearFilters} className="flex-1 py-2.5 px-4 rounded-lg text-sm font-bold text-gray-300 hover:text-white bg-surfaceBorder/30 hover:bg-surfaceBorder/50 transition-colors">
                                Clear All
                            </button>
                            <button onClick={onClose} className="flex-1 py-2.5 px-4 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary-hover shadow-lg transition-all">
                                View Results
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}