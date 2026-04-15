import { useState } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './auth';
import type { User, Organization, Project } from './auth';

// Manages global authentication state, user session, and multi-tenant context
export default function AuthProvider({ children }: { children: ReactNode }) {
    // Initializes session token from browser local storage
    const [token, setToken] = useState<string | null>(localStorage.getItem('jwt_token'));

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
    const login = (newToken: string, userData: User, organizations: Organization[]) => {
        const primaryOrg = organizations[0];
        setToken(newToken);
        setUser(userData);
        setActiveOrganization(primaryOrg);
        setActiveProjectState(null);
        localStorage.removeItem('activeProject');
        localStorage.setItem('jwt_token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('active_org', JSON.stringify(primaryOrg));
    };

    // Terminates the session by clearing all sensitive data from state and storage
    const logout = () => {
        setToken(null);
        setUser(null);
        setActiveOrganization(null);
        setActiveProjectState(null);
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user');
        localStorage.removeItem('active_org');
        localStorage.removeItem('activeProject');
    };

    return (
        <AuthContext.Provider value={{
            token,
            user,
            activeOrganization,
            activeProject,         
            setActiveProject,      
            login,
            logout,
            isAuthenticated: !!token
        }}>
            {children}
        </AuthContext.Provider>
    );
}