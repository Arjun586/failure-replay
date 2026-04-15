// client/src/core/context/theme.ts
import { createContext, useContext } from 'react';

// Defines the valid color themes available across the platform
export type Theme = 'purple' | 'blue' | 'red' | 'gray';

// Describes the structure of the theme context state and management functions
export interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

// Initializes a React context for system-wide theme management
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Custom hook to access the current theme and its setter from any component
export function useTheme() {
    const context = useContext(ThemeContext);
    // Ensures the hook is only used within a valid ThemeProvider component
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
}