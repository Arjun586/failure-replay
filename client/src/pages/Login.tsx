// client/src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, AlertCircle, TerminalSquare, X } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../contexts/auth';
import { isAxiosError } from 'axios';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    const { login } = useAuth(); // Grab our global login function

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
        
            const response = await apiClient.post('/auth/login', {
                email,
                password,
            });

            const { token, user, organizations } = response.data;

            
            login(token, user, organizations);

            
            navigate('/dashboard');
        } catch (err) { // err defaults to 'unknown'
        if (isAxiosError(err)) {
            // TypeScript now securely knows 'err' has the AxiosError shape
            const message = err.response?.data?.error || 'Failed to connect to the server.';
            setError(message);
        } else {
            // It was some other kind of non-HTTP error (e.g., a generic JS error)
            setError('An unexpected error occurred.');
        }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        
        <div className="relative min-h-screen w-full flex items-center justify-center bg-background p-4 overflow-hidden">
            
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none z-0" />
            
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, type: 'spring', stiffness: 100 }}
                className="relative z-10 w-full max-w-md bg-surface border border-surfaceBorder rounded-2xl shadow-xl overflow-hidden"
            >
                {/* Close button to return to home */}
                <Link 
                    to="/" 
                    className="absolute top-4 right-4 p-2 text-muted hover:text-gray-200 transition-colors rounded-full hover:bg-surfaceBorder/50"
                    aria-label="Close and return home"
                >
                    <X size={20} />
                </Link>
            
                <div className="p-8">
                    {/* Logo / Branding */}
                    <div className="flex flex-col items-center mb-8">
                        <motion.div 
                            animate={{ y: [-2, 2, -2] }} 
                            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} 
                            className="w-12 h-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center mb-4 shadow-[0_0_15px_rgb(var(--primary)/0.2)]"
                        >
                            <TerminalSquare size={28} />
                        </motion.div>
                        <h1 className="text-2xl font-bold text-gray-100">Welcome Back</h1>
                        <p className="text-muted text-sm mt-1">Sign in to Failure Replay</p>
                    </div>

                    {/* Error Banner */}
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

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-muted" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-[#18181b] border border-surfaceBorder text-gray-200 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 hover:border-primary/50 transition-all duration-300"
                                    placeholder="engineer@company.com"
                                />
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock size={18} className="text-muted" />
                                </div>
                                <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-[#18181b] border border-surfaceBorder text-gray-200 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 hover:border-primary/50 transition-all duration-300"
                                placeholder="••••••••"
                                />
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                            <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-2.5 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgb(var(--primary)/0.4)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                            >
                            {isLoading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                'Sign In'
                            )}
                            </button>
                        </motion.div>
                    </form>
                </div>

                {/* Footer Link to Register */}
                <div className="border-t border-surfaceBorder bg-surfaceBorder/10 p-4 text-center">
                    <p className="text-sm text-muted">
                        Don't have an organization yet?{' '}
                        <Link to="/register" className="text-primary hover:text-primary-hover font-medium transition-colors">
                            Create an account
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}