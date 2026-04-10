import { LayoutDashboard, AlertCircle, FileText, Settings, ChevronDown, FolderArchive, Activity, Plus, UserPlus, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

import InviteTeamModal from '../../features/auth/components/InviteTeamModal';
import CreateProjectModal from '../../features/projects/components/CreateProjectModal';
import { useAuth } from '../context/auth';
import { apiClient } from '../api/client';
import type { Project } from '../context/auth';

type NavItem = {
    name: string;
    icon: React.ElementType;
    href: string;
};

// Fixed HREFs to match your routing
const navItems: NavItem[] = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: "Incidents", icon: AlertCircle, href: '/incidents' },
    { name: "Postmortems", icon: FileText, href: '/postmortems' },
    { name: "Settings", icon: Settings, href: '/settings' },
];

export default function Sidebar() {
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const { activeOrganization, activeProject, setActiveProject, user, logout } = useAuth();

    // Dropdown State
    const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);

    const navigate = useNavigate(); 

    // Fetch Projects when Sidebar mounts
    useEffect(() => {
        const fetchProjects = async () => {
            if (!activeOrganization) return;
            try {
                const response = await apiClient.get(`/projects?orgId=${activeOrganization.id}`);
                setProjects(response.data.data);
                
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
        // 🚀 FIX 1: Removed 'fixed left-0 top-0', kept your original layout constraints
        <aside className="w-64 h-screen bg-surface border-r border-surfaceBorder flex flex-col z-20">
            
            {/* 1. BRANDING */}
            <div className="p-4 relative">
                <div className="flex items-center gap-3 px-2 mb-6 mt-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                        <Activity size={18} className="text-primary" />
                    </div>
                    <h1 className="text-gray-100 font-bold text-lg tracking-wide">
                        Replay<span className="text-primary">OS</span>
                    </h1>
                </div>

                {/* 2. PROJECT SWITCHER */}
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

                {/* DROPDOWN MENU */}
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
                            
                            {/* ONLY ADMINS CAN CREATE PROJECTS */}
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

            {/* 3. MAIN NAVIGATION */}
            {/* 🚀 FIX 2: Removed overflow-y-auto to kill the ugly scrollbar, removed fake data */}
            <div className="flex-1 px-4 py-2">
                <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted mb-3">Menu</p>
                <nav className="flex flex-col gap-1.5">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.href}
                            className={({ isActive }) => 
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                    isActive 
                                    ? 'bg-primary/10 text-primary shadow-[inset_2px_0_0_rgb(139,92,246)]' 
                                    : 'text-gray-400 hover:bg-surfaceBorder/30 hover:text-gray-200'
                                }`
                            }
                        >
                            <item.icon size={18} />
                            {item.name}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* 4. USER PROFILE & ACTIONS (Bottom) */}
            <div className="p-4 border-t border-surfaceBorder bg-surfaceBorder/5">
                <div className="flex items-center gap-3 px-1 mb-4">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <span className="text-sm font-semibold text-gray-200 truncate">{user?.name}</span>
                        <div className="flex items-center gap-2">
                            {activeOrganization?.role === 'ADMIN' ? (
                                <span className="text-[9px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded">ADMIN</span>
                            ) : (
                                <span className="text-[9px] font-bold bg-surfaceBorder text-muted px-1.5 py-0.5 rounded">MEMBER</span>
                            )}
                        </div>
                    </div>
                    
                    {/* Logout Button */}
                    <button onClick={logout} className="text-muted hover:text-red-400 transition-colors p-2 rounded-md hover:bg-red-400/10">
                        <LogOut size={16} />
                    </button>
                </div>

                {/* Only Admins see the Invite button */}
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

            {/* Modals */}
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