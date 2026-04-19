import { useState } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './auth';
import type { User, Organization, Project } from './auth';

// Manages global authentication state, user session, and multi-tenant context
export default function AuthProvider({ children }: { children: ReactNode }) {
    // Loads persisted user profile data from storage or defaults to null
    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });

    // Maintains the currently active organization for the user session
    const [activeOrganization, setActiveOrganization] = useState<Organization | null>(() => {
        const saved = localStorage.getItem('active_org');
        return saved ? JSON.parse(saved) : null;
    });
    
    // Tracks the selected project workspace within the current organization
    const [activeProject, setActiveProjectState] = useState<Project | null>(() => {
        const saved = localStorage.getItem('activeProject');
        return saved ? JSON.parse(saved) : null;
    });

    // Updates the active project and persists the selection to local storage
    const setActiveProject = (project: Project) => {
        setActiveProjectState(project);
        localStorage.setItem('activeProject', JSON.stringify(project));
    };

    // Processes user login by establishing session state and persisting credentials
    // Removed the 'newToken' string parameter since the server handles the secure cookie
    const login = (userData: User, organizations: Organization[]) => { 
        const primaryOrg = organizations[0];
        setUser(userData);
        setActiveOrganization(primaryOrg);
        setActiveProjectState(null);
        localStorage.removeItem('activeProject');
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('active_org', JSON.stringify(primaryOrg));
        // Sets a simple boolean flag in storage to indicate an active session exists
        localStorage.setItem('is_logged_in', 'true'); 
    };

    // Terminates the session by clearing all sensitive data from state and storage
    const logout = () => {
        setUser(null);
        setActiveOrganization(null);
        setActiveProjectState(null);
        localStorage.removeItem('user');
        localStorage.removeItem('active_org');
        localStorage.removeItem('activeProject');
        // Clears the session boolean flag from storage
        localStorage.removeItem('is_logged_in'); 
    };

    return (
        <AuthContext.Provider value={{
            user,
            activeOrganization,
            activeProject,         
            setActiveProject,      
            login,
            logout,
            // Derives authentication status directly from the presence of a user profile
            isAuthenticated: !!user 
        }}>
            {children}
        </AuthContext.Provider>
    );
}