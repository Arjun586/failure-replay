// client/src/App.tsx
import { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from '../core/components/Sidebar';
import IncidentTable from '../features/incidents/components/IncidentTable';
import FileUploader from '../features/projects/components/FileUploader';
import IncidentTimeline from '../features/incidents/pages/IncidentTimeline';
import Login from '../features/auth/pages/Login';
import Register from '../features/auth/pages/Register';
import ProtectedRoute from '../core/components/ProtectedRoute';
import { useAuth } from '../core/context/auth';
import AcceptInvite from '../features/auth/pages/AcceptInvite';
import Landing from './Landing';
import { Activity, Loader2, Code2, UploadCloud } from 'lucide-react'; 
import { apiClient } from '../core/api/client';
import SetupGuide from '../features/projects/components/SetupGuide';

function Dashboard() {
    const [refreshKey, setRefreshKey] = useState(0);
    const [isSimulating, setIsSimulating] = useState(false);
    const { activeProject } = useAuth(); // Get the active project
    const [isSetupOpen, setIsSetupOpen] = useState(false); 
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    const handleSimulateTraffic = async () => {
        if (!activeProject) return;
        setIsSimulating(true);
        try {
            await apiClient.post(`/projects/${activeProject.id}/simulate`);
            // Increment refreshKey to automatically re-fetch the IncidentTable
            setRefreshKey(prev => prev + 1); 
        } catch (error) {
            console.error("Failed to simulate traffic:", error);
        } finally {
            setIsSimulating(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-100 tracking-tight">Dashboard</h2>
                    <p className="text-muted mt-2">Monitor and investigate system failures in real-time.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* 🚀 SETUP GUIDE BUTTON */}
                    <button 
                        onClick={() => setIsSetupOpen(true)}
                        className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors border border-surfaceBorder hover:border-gray-500 bg-surface px-4 py-2.5 rounded-lg font-medium"
                    >
                        <Code2 size={16} className="text-primary" />
                        Instrument App
                    </button>

                    <button 
                        onClick={() => setIsUploadOpen(!isUploadOpen)}
                        className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors border border-surfaceBorder hover:border-gray-500 bg-surface px-4 py-2.5 rounded-lg font-medium"
                    >
                        <UploadCloud size={16} />
                        Upload
                    </button>

                    <button 
                        onClick={handleSimulateTraffic}
                        disabled={isSimulating || !activeProject}
                        className="flex items-center gap-2 bg-glass border border-primary/50 text-primary hover:bg-primary/10 px-4 py-2.5 rounded-lg font-medium transition-all shadow-[0_0_15px_rgb(var(--primary)/0.15)] disabled:opacity-50"
                    >
                        {isSimulating ? <Loader2 size={18} className="animate-spin" /> : <Activity size={18} />}
                        Simulate Mock Traffic
                    </button>
                </div>
            </header>

            {/* 🚀 RENDER SETUP MODAL */}
            {isSetupOpen && activeProject && (
                <SetupGuide 
                    projectId={activeProject.id} 
                    onClose={() => setIsSetupOpen(false)} 
                />
            )}

            {/* Render Upload Box (tum isko bhi baad mein modal bana sakte ho) */}
            {isUploadOpen && (
                <div className="mb-6">
                    <FileUploader onUploadSuccess={() => {
                        setRefreshKey(prev => prev + 1);
                        setIsUploadOpen(false);
                    }} />
                </div>
            )}

            {/* 🚀 THE TABLE ALONE */}
            <div className="mt-4">
                <IncidentTable 
                    projectId={activeProject?.id}
                    key={refreshKey} 
                    // onDataLoad ki ab technically zaroorat nahi hai UI hide karne ke liye, 
                    // kyunki sab buttons se control ho raha hai
                />
            </div>
        </div>
    );
}

// A layout component that wraps the protected routes
// It ensures the Sidebar and Main padding only appear when logged in
function AuthenticatedLayout() {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-10">
                <Outlet /> {/* This is where the nested routes (Dashboard, Timeline) will render */}
            </main>
        </div>
    );
}

function App() {
    const { isAuthenticated } = useAuth();

    return (
        <Routes>

            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />} />
            {/* 
                PUBLIC ROUTES
                If the user is already logged in, kick them back to the Dashboard.
                These pages do NOT have the Sidebar.
            */}
            <Route 
                path="/login" 
                element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
            />
            <Route 
                path="/register" 
                element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} 
            />

            <Route path="/invite/:token" element={isAuthenticated ? <Navigate to="/" replace /> : <AcceptInvite />} />

            {/* 
                PROTECTED ROUTES 
                Wrapped by ProtectedRoute -> Redirects to /login if unauthenticated.
                Wrapped by AuthenticatedLayout -> Provides the Sidebar and spacing.
            */}
            <Route element={<ProtectedRoute />}>
                <Route element={<AuthenticatedLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/incident/:id" element={<IncidentTimeline />} />
                </Route>
            </Route>

            {/* Catch-All Route: Redirect to home (or login if unauthenticated) */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;