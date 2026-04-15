// client/src/features/projects/components/CreateProjectModal.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderPlus, Loader2, AlertCircle } from 'lucide-react';
import { apiClient } from '../../../core/api/client';
import { useAuth } from '../../../core/context/auth';
import { isAxiosError } from 'axios';

/**
 * Interface Definition
 * isOpen: Controls the visibility of the modal via AnimatePresence.
 * onClose: Callback to dismiss the modal.
 * onSuccess: Callback to update the parent state with the newly created project data.
 */
interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newProject: any) => void;
}

/**
 * CreateProjectModal Component
 * Provides a specialized interface for creating new project workspaces within 
 * the user's active organization.
 */
export default function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
    // Retrieves the current organization context for API associations
    const { activeOrganization } = useAuth();
    
    // Local state for form management and UI feedback
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Handles the asynchronous project creation request.
     * Prevents execution if organization context is missing and manages loading states.
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeOrganization) return;
        
        setError(null);
        setIsLoading(true);

        try {
            // Persists the new project to the backend
            const response = await apiClient.post('/projects', {
                name,
                organizationId: activeOrganization.id
            });

            // Executes success handlers: update parent UI, reset form, and close modal
            onSuccess(response.data.data);
            setName('');
            onClose();
        } catch (err) {
            // Parses structured error messages from the API
            if (isAxiosError(err)) {
                setError(err.response?.data?.message || 'Failed to create project.');
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* BACKDROP: Semi-transparent overlay with click-to-close functionality */}
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        onClick={onClose} 
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
                    />

                    {/* MODAL BODY: Content container with entry and exit animations */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                        animate={{ opacity: 1, scale: 1, y: 0 }} 
                        exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                        className="relative w-full max-w-md bg-surface border border-surfaceBorder rounded-xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header: Branding and Dismiss action */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-surfaceBorder bg-surface/50">
                            <div className="flex items-center gap-2">
                                <FolderPlus size={18} className="text-primary" />
                                <h2 className="text-lg font-bold text-gray-100">Create New Project</h2>
                            </div>
                            <button onClick={onClose} className="text-muted hover:text-gray-200 p-1 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* ERROR ALERT: Contextual feedback for failed creation attempts */}
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 flex items-start gap-2 text-sm">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* PROJECT FORM: Input for workspace naming */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Project Name</label>
                                    <input 
                                        type="text" 
                                        value={name} 
                                        onChange={(e) => setName(e.target.value)} 
                                        required 
                                        placeholder="e.g. Mobile API, Frontend App" 
                                        className="w-full bg-[#18181b] border border-surfaceBorder text-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors placeholder:text-muted/50" 
                                    />
                                </div>

                                {/* ACTION: Submit button with loading spinner state */}
                                <button 
                                    type="submit" 
                                    disabled={isLoading || !name} 
                                    className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 mt-4"
                                >
                                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
                                    Create Project
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}