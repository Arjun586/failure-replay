import { createContext, useContext } from 'react';

export interface User {
    id: string;
    email: string;
    name: string;
}

export interface Organization {
    id: string;
    name: string;
    slug: string;
    role?: 'ADMIN' | 'MEMBER';
}

export interface Project {
    id: string;
    name: string;
    organizationId: string;
    ingestKey: string;
}

export interface AuthContextType {
    token: string | null;
    user: User | null;
    activeOrganization: Organization | null;
    activeProject: Project | null;
    setActiveProject: (project: Project) => void;    
    login: (token: string, user: User, organizations: Organization[]) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};