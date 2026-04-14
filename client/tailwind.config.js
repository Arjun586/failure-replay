/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Map to CSS Variables in index.css
        background: 'rgb(var(--bg-main) / <alpha-value>)',
        surface: 'rgb(var(--bg-surface) / <alpha-value>)',
        surfaceBorder: 'rgb(var(--border-surface) / <alpha-value>)',
        
        glass: 'rgb(var(--bg-surface) / 0.6)',
        glassBorder: 'rgb(var(--border-surface) / 0.5)',

        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          hover: 'rgb(var(--primary-hover) / <alpha-value>)',
        },
        foreground: '#ffffff',
        muted: '#a1a1aa',
        
        status: {
          error: '#ef4444',
          warning: '#f59e0b',
          success: '#10b981',
          info: '#3b82f6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backdropBlur: {
        glass: '12px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}