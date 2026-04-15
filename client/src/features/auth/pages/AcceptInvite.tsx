import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Lock, Loader2, AlertCircle, TerminalSquare } from 'lucide-react';
import { apiClient } from '../../../core/api/client';
import { useAuth } from '../../../core/context/auth';
import { isAxiosError } from 'axios';

// Component to handle user account setup after accepting an organization invitation
export default function AcceptInvite() {
    // Retrieves the unique invitation token from the URL parameters
    const { token } = useParams<{ token: string }>(); 
    const navigate = useNavigate();
    // Accesses the global login function to establish a session upon success
    const { login } = useAuth();

    // Local state for managing user input, loading status, and error messages
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Processes the form submission to create the user account and join the organization
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // Sends the token and account details to the backend acceptance endpoint
            const response = await apiClient.post('/invites/accept', {
                token,
                name,
                password,
            });

            // Extracts the session token and user metadata from the successful response
            const { token: jwtToken, user, organizations } = response.data;

            // Updates the global authentication context and redirects the user to the dashboard
            login(jwtToken, user, organizations);
            navigate('/dashboard');
            
        } catch (err) {
            // Handles API errors and extracts human-readable messages for the UI
            if (isAxiosError(err)) {
                const errData = err.response?.data?.error;
                if (Array.isArray(errData)) {
                    setError(errData[0].message);
                } else if (typeof errData === 'string') {
                    setError(errData);
                } else {
                    setError('Failed to accept invitation.');
                }
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
            {/* Animated container for the invitation acceptance card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
                className="w-full max-w-md bg-surface border border-surfaceBorder rounded-2xl shadow-xl overflow-hidden"
            >
                <div className="p-8">
                    {/* Header section with branding and instructions */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-12 h-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center mb-4">
                            <TerminalSquare size={28} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-100">Join the Team</h1>
                        <p className="text-muted text-sm mt-1 text-center">
                            You've been invited to join an organization on ReplayOS. Set up your account to continue.
                        </p>
                    </div>

                    {/* Displays an alert banner if an error occurs during submission */}
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }} 
                            animate={{ opacity: 1, height: 'auto' }} 
                            className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 flex items-center gap-2 text-sm"
                        >
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{error}</span>
                        </motion.div>
                    )}

                    {/* Main account setup form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Input field for the user's full name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User size={18} className="text-muted" />
                                </div>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="Jane Doe"
                                    className="w-full bg-[#18181b] border border-surfaceBorder text-gray-200 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors placeholder:text-muted/50"
                                />
                            </div>
                        </div>

                        {/* Input field for setting a new account password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Create a Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-muted" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-[#18181b] border border-surfaceBorder text-gray-200 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                                />
                            </div>
                            <p className="text-xs text-muted mt-2">Must be at least 8 characters.</p>
                        </div>

                        {/* Submission button with loading state indicator */}
                        <button
                            type="submit"
                            disabled={isLoading || !name || password.length < 8}
                            className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
                            Accept Invitation
                        </button>
                    </form>
                </div>
                
                {/* Footer link for users who already have an account */}
                <div className="border-t border-surfaceBorder bg-surfaceBorder/10 p-4 text-center">
                    <p className="text-sm text-muted">
                        Already have an account? <Link to="/login" className="text-primary hover:text-primary-hover font-medium transition-colors">Sign in</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}