import { createContext, useContext } from 'react';

// Defines the properties for a registered system user
export interface User {
    id: string;
    email: string;
    name: string;
}

// Represents an organization entity within the multi-tenant architecture
export interface Organization {
    id: string;
    name: string;
    slug: string;
    role?: 'ADMIN' | 'MEMBER';
}

// Represents an individual project workspace linked to an organization
export interface Project {
    id: string;
    name: string;
    organizationId: string;
    ingestKey: string;
}

// Defines the global state and methods available for authentication management
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

// Initializes the authentication context for the React component tree
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to access authentication state and organizational context
export const useAuth = () => {
    const context = useContext(AuthContext);
    // Ensures the hook is used within the appropriate provider scope
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};