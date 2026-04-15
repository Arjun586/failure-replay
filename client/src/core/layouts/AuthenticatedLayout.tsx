// client/src/core/layouts/AuthenticatedLayout.tsx
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

// Provides a consistent structure with a sidebar for all authenticated internal pages
export default function AuthenticatedLayout() {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            {/* Persists the navigation sidebar on the left side of the screen */}
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-10">
                {/* Renders the specific component for the matched child route */}
                <Outlet /> 
            </main>
        </div>
    );
}