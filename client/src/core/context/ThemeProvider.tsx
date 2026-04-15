// client/src/core/context/ThemeProvider.tsx
import React, { useEffect, useState } from 'react';
import { ThemeContext, type Theme } from './theme';

// Wraps the application to provide and persist theme settings
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    // Loads the preferred theme from local storage or defaults to 'purple'
    const [theme, setTheme] = useState<Theme>(() => {
        return (localStorage.getItem('app-theme') as Theme) || 'purple';
    });

    // Synchronizes the selected theme with browser storage and the document root class
    useEffect(() => {
        localStorage.setItem('app-theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}