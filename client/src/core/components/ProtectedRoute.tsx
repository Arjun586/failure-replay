// client/src/components/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth';

// Protects internal routes by verifying the user's authentication status
export default function ProtectedRoute() {
    // Accesses global auth state to determine if a session exists
    const { isAuthenticated } = useAuth();
    // Captures the current browser location for post-login redirection
    const location = useLocation(); 

    // Redirects unauthenticated users to the login page while preserving their target URL
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Renders the intended child components if the user is verified
    return <Outlet />;
}