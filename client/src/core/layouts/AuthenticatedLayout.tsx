import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function AuthenticatedLayout() {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-10">
                <Outlet /> {/* Nested routes yahan aayenge */}
            </main>
        </div>
    );
}