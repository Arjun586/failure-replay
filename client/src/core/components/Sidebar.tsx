import { LayoutDashboard, AlertCircle, Settings, ChevronDown, BookOpen, FolderArchive, Activity, Plus, UserPlus, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import InviteTeamModal from '../../features/auth/components/InviteTeamModal';
import CreateProjectModal from '../../features/projects/components/CreateProjectModal';
import { useAuth } from '../context/auth';
import { apiClient } from '../api/client';
import type { Project } from '../context/auth';

// Defines the individual navigation items for the application sidebar
type NavItem = {
    name: string;
    icon: React.ElementType;
    href: string;
};

// Configures the primary navigation links visible in the menu
const navItems: NavItem[] = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: "Incidents", icon: AlertCircle, href: '/incidents' },
    { name: "Documentation", icon: BookOpen, href: '/docs' },
    { name: "Settings", icon: Settings, href: '/settings' },
];

// Main sidebar component providing global navigation and project switching
export default function Sidebar() {
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    // Retrieves global authentication and active organization/project state
    const { activeOrganization, activeProject, setActiveProject, user, logout } = useAuth();

    // Local state to manage project selection and modal visibility
    const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);

    const navigate = useNavigate(); 

    // Synchronizes the project list based on the active organization when the component mounts
    useEffect(() => {
        const fetchProjects = async () => {
            if (!activeOrganization) return;
            try {
                // Retrieves all projects associated with the current organization ID
                const response = await apiClient.get(`/projects?orgId=${activeOrganization.id}`);
                setProjects(response.data.data);
   
                // Automatically selects the first available project if none is active
                if (!activeProject && response.data.data.length > 0) {
                    setActiveProject(response.data.data[0]);
                }
            } catch (error) {
                console.error('Failed to fetch projects', error);
            }
        };
        fetchProjects();
    }, [activeOrganization]);

    return (
        <aside className="w-64 h-screen bg-surface border-r border-surfaceBorder flex flex-col z-20">
            
            {/* BRANDING: Directs users to the primary dashboard */}
            <div className="p-4 relative">
                <Link to="/dashboard" className="flex items-center gap-3 px-2 mb-6 mt-2">
                    <div className="w-8 h-8 rounded-lg brand-logo">
                        <Activity size={18} />
                    </div>
                    <h1 className="text-gray-100 font-bold text-lg tracking-wide">
                        Replay<span className="text-primary">OS</span>
                    </h1>
                </Link>

                {/* PROJECT SWITCHER: Allows toggling between different project environments */}
                <button 
                    onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-surfaceBorder/20 border border-surfaceBorder rounded-lg hover:bg-surfaceBorder/40 transition-colors group"
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        <FolderArchive size={16} className="text-primary shrink-0" />
                        <div className="flex flex-col items-start truncate">
                            <span className="text-[10px] uppercase tracking-wider text-muted font-medium group-hover:text-gray-400">
                                {activeOrganization?.name || 'Organization'}
                            </span>
                            <span className="text-sm text-gray-200 font-semibold truncate group-hover:text-white transition-colors">
                                {activeProject?.name || 'Select Project'}
                            </span>
                        </div>
                    </div>
                    <ChevronDown size={16} className={`text-muted transition-transform duration-200 ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* DROPDOWN MENU: Renders the list of selectable projects with animation */}
                <AnimatePresence>
                    {isProjectDropdownOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-[130px] left-4 right-4 bg-surface border border-surfaceBorder rounded-lg shadow-xl overflow-hidden z-50"
                        >
                            <div className="max-h-48 py-1">
                                {projects.map((project) => (
                                    <button
                                        key={project.id}
                                        onClick={() => {
                                            setActiveProject(project);
                                            setIsProjectDropdownOpen(false);
                                            navigate('/dashboard');
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors text-left ${
                                            activeProject?.id === project.id 
                                                ? 'bg-primary/10 text-primary font-medium' 
                                                : 'text-gray-300 hover:bg-surfaceBorder/30 hover:text-gray-100'
                                        }`}
                                    >
                                        {project.name}
                                    </button>
                                ))}
                            </div>
                            
                            {/* PROJECT CREATION: Restricted to users with the ADMIN role */}
                            {activeOrganization?.role === 'ADMIN' && (
                                <div className="border-t border-surfaceBorder p-1">
                                    <button 
                                        onClick={() => {
                                            setIsProjectDropdownOpen(false);
                                            setIsCreateProjectModalOpen(true);
                                        }}
                                        className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-primary hover:bg-surfaceBorder/30 rounded-md transition-colors font-medium"
                                    >
                                        <Plus size={16} /> Create New Project
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* MAIN NAVIGATION: Renders standard menu links using NavLink for active styling */}
            <div className="flex-1 px-4 py-2">
                <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted mb-3">Menu</p>
                <nav className="flex flex-col gap-1.5">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.href}
                            className={({ isActive }) => 
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                                    isActive 
                                    ? 'sidebar-link-active shadow-[inset_2px_0_0_rgb(var(--primary))]' 
                                    : 'text-gray-400 hover:bg-surfaceBorder/30 hover:text-gray-200 font-medium'
                                }`
                            }
                        >
                            <item.icon size={18} />
                            {item.name}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* USER PROFILE: Displays user info, role badges, and account actions */}
            <div className="p-4 border-t border-surfaceBorder bg-surfaceBorder/5">
                <div className="flex items-center gap-3 px-1 mb-4">
                    <div className="w-9 h-9 rounded-full brand-logo font-bold text-lg">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <span className="text-sm font-semibold text-gray-200 truncate">{user?.name}</span>
                        <div className="flex items-center gap-2">
                            {activeOrganization?.role === 'ADMIN' ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded theme-icon-box tracking-wider">
                                    ADMIN
                                </span>
                            ) : (
                                <span className="text-[9px] font-bold bg-surfaceBorder text-muted px-1.5 py-0.5 rounded tracking-wider">
                                    MEMBER
                                </span>
                            )}
                        </div>
                    </div>
                    
                    {/* LOGOUT: Clears user session and redirects to landing page */}
                    <button onClick={logout} className="text-muted hover:text-red-400 transition-colors p-2 rounded-md hover:bg-red-400/10">
                        <LogOut size={16} />
                    </button>
                </div>

                {/* TEAM INVITATION: Visibility limited to ADMINS for workspace growth */}
                {activeOrganization?.role === 'ADMIN' && (
                    <button 
                        onClick={() => setIsInviteModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-surfaceBorder/20 rounded-md text-gray-300 hover:text-white hover:bg-surfaceBorder/50 transition-colors border border-surfaceBorder/30"
                    >
                        <UserPlus size={16} />
                        <span className="font-medium text-xs">Invite Team</span>
                    </button>
                )}
            </div>

            {/* MODAL OVERLAYS: Provides entry points for organization and project setup */}
            <InviteTeamModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} />
            <CreateProjectModal 
                isOpen={isCreateProjectModalOpen} 
                onClose={() => setIsCreateProjectModalOpen(false)} 
                onSuccess={(newProject) => {
                    setProjects([...projects, newProject]);
                    setActiveProject(newProject);
                    window.location.reload();
                }}
            />
        </aside>
    );
}