import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle2, AlertCircle, Copy, Users } from 'lucide-react';
import { apiClient } from '../../../core/api/client';
import { useAuth } from '../../../core/context/auth';
import { isAxiosError } from 'axios';

// Defines the component props for the team invitation modal
interface InviteTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Manages the team invitation flow including data submission and link generation
export default function InviteTeamModal({ isOpen, onClose }: InviteTeamModalProps) {
    const { activeOrganization } = useAuth();
    
    // Initializes local state for form inputs, loading status, and error handling
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Processes the invitation submission and retrieves a secure link from the API
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeOrganization) return;

        setError(null);
        setIsLoading(true);

        try {
            const response = await apiClient.post('/invites', {
                email,
                role,
                organizationId: activeOrganization.id
            });

            // Persists the generated invitation link returned by the backend
            setInviteLink(response.data.data.inviteLink);
        } catch (err) {
            if (isAxiosError(err)) {
                const errData = err.response?.data?.error;

                // Dynamically extracts error messages from Zod arrays or string responses
                if (Array.isArray(errData)) {
                    setError(errData[0].message);
                } else if (typeof errData === 'string') {
                    setError(errData);
                } else {
                    setError('Failed to send invitation.');
                }
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Copies the generated invitation link to the system clipboard
    const handleCopy = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Resets the modal state to allow for multiple subsequent invitations
    const handleReset = () => {
        setInviteLink(null);
        setEmail('');
        setRole('MEMBER');
        setError(null);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop: Provides a blurred overlay behind the modal */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                    />

                    {/* Modal Container: Animates from the bottom with a spring transition */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-surface border border-surfaceBorder rounded-xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header: Displays the title and close action */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-surfaceBorder bg-surface/50">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                    <Users size={18} />
                                </div>
                                <h2 className="text-lg font-bold text-gray-100">Invite Team Member</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-muted hover:text-gray-200 transition-colors p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content: Renders either the entry form or the success state */}
                        <div className="p-6">
                            {/* Error Banner: Conditional display for validation or server failures */}
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 flex items-start gap-2 text-sm">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {!inviteLink ? (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Email Field: Collects the recipient's destination address */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            placeholder="engineer@company.com"
                                            className="w-full bg-[#18181b] border border-surfaceBorder text-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                                        />
                                    </div>

                                    {/* Role Selection: Determines the access level for the new member */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Role</label>
                                        <select
                                            value={role}
                                            onChange={(e) => setRole(e.target.value as 'ADMIN' | 'MEMBER')}
                                            className="w-full bg-[#18181b] border border-surfaceBorder text-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors appearance-none"
                                        >
                                            <option value="MEMBER">Member (Can view/upload logs)</option>
                                            <option value="ADMIN">Admin (Can invite users & manage projects)</option>
                                        </select>
                                    </div>

                                    {/* Submit Button: Triggers the invitation creation request */}
                                    <button
                                        type="submit"
                                        disabled={isLoading || !email}
                                        className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                                    >
                                        {isLoading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Send size={18} />
                                        )}
                                        Send Invitation
                                    </button>
                                </form>
                            ) : (
                                /* Success State: Displays the shareable invitation link */
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }} 
                                    animate={{ opacity: 1, scale: 1 }} 
                                    className="flex flex-col items-center text-center py-4"
                                >
                                    <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle2 size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-100 mb-2">Invitation Created</h3>
                                    <p className="text-sm text-muted mb-6">
                                        Share this secure link with the user. It will expire in 7 days.
                                    </p>
                                    
                                    {/* Link Container: Provides a read-only view and copy functionality */}
                                    <div className="w-full flex items-center gap-2 bg-[#09090b] border border-surfaceBorder rounded-lg p-2 mb-6">
                                        <input 
                                            type="text" 
                                            readOnly 
                                            value={inviteLink} 
                                            className="w-full bg-transparent text-sm text-gray-300 px-2 focus:outline-none"
                                        />
                                        <button 
                                            onClick={handleCopy}
                                            className="px-3 py-1.5 bg-surfaceBorder hover:bg-surfaceBorder/80 text-gray-200 rounded-md transition-colors text-sm font-medium flex items-center gap-2 shrink-0"
                                        >
                                            {copied ? <CheckCircle2 size={14} className="text-green-500"/> : <Copy size={14} />}
                                            {copied ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>

                                    {/* Reset Trigger: Reverts the modal to the form state */}
                                    <button
                                        onClick={handleReset}
                                        className="text-sm text-primary hover:text-primary-hover transition-colors font-medium"
                                    >
                                        Invite another member
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}