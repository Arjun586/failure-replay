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
import Incidents from '../features/incidents/pages/Incidents';
import Settings from '../features/dashboard/pages/Settings';
import Documentation from '../features/docs/pages/Documentation';

// The main application component that defines the routing structure for ReplayOS
export default function App() {
    // Accesses global authentication state to determine route accessibility
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            {/* Root route: redirects to dashboard if logged in, otherwise shows landing page */}
            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />} />
            
            {/* PUBLIC ROUTES: Only accessible when not logged in; otherwise redirects to home */}
            <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />
            <Route path="/invite/:token" element={isAuthenticated ? <Navigate to="/" replace /> : <AcceptInvite />} />

            {/* PROTECTED ROUTES: Requires a valid session via the ProtectedRoute guard */}
            <Route element={<ProtectedRoute />}>
                {/* Wraps internal pages in a consistent sidebar and navigation layout */}
                <Route element={<AuthenticatedLayout />}>
                    {/* Primary dashboard for system health and metrics overview */}
                    <Route path="/dashboard" element={<Dashboard />} />
                    
                    {/* Detailed incident analysis view featuring timelines and traces */}
                    <Route path="/incident/:id" element={<IncidentTimeline />} />
                    
                    {/* Navigates to the searchable database of all system incidents */}
                    <Route path="/incidents" element={<Incidents />} />
                    
                    {/* Documentation hub for SDK setup and platform architecture */}
                    <Route path="/docs" element={<Documentation />} />
                    
                    {/* Workspace settings for managing API keys and appearance */}
                    <Route path="/settings" element={<Settings />} />
                </Route>
            </Route>

            {/* Catch-All: Redirects any undefined paths back to the home route */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}