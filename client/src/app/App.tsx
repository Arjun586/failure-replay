import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../core/context/auth';

// Layouts & Guards
import ProtectedRoute from '../core/components/ProtectedRoute'
import AuthenticatedLayout from '../core/layouts/AuthenticatedLayout';

// Pages
import Landing from './Landing';
import Login from '../features/auth/pages/Login';
import Register from '../features/auth/pages/Register';
import AcceptInvite from '../features/auth/pages/AcceptInvite';
import Dashboard from '../features/dashboard/pages/Dashboard';
import IncidentTimeline from '../features/incidents/pages/IncidentTimeline';

// Placeholders for sidebar links (Bina inke router error de sakta hai agar link click karo toh)
function IncidentsPlaceholder() { return <div className="p-8 text-center text-gray-400">Incidents Page - Coming Soon</div>; }
function PostmortemsPlaceholder() { return <div className="p-8 text-center text-gray-400">Postmortems Page - Coming Soon</div>; }
function SettingsPlaceholder() { return <div className="p-8 text-center text-gray-400">Settings Page - Coming Soon</div>; }

export default function App() {
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />} />
            
            {/* PUBLIC ROUTES */}
            <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />
            <Route path="/invite/:token" element={isAuthenticated ? <Navigate to="/" replace /> : <AcceptInvite />} />

            {/* PROTECTED ROUTES */}
            <Route element={<ProtectedRoute />}>
                <Route element={<AuthenticatedLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/incident/:id" element={<IncidentTimeline />} />
                    
                    {/* Empty Routes for sidebar links */}
                    <Route path="/incidents" element={<IncidentsPlaceholder />} />
                    <Route path="/postmortems" element={<PostmortemsPlaceholder />} />
                    <Route path="/settings" element={<SettingsPlaceholder />} />
                </Route>
            </Route>

            {/* Catch-All Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}