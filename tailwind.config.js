/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6',
          dark: '#2563eb',
          light: '#60a5fa',
        },
        secondary: {
          DEFAULT: '#10b981',
          dark: '#059669',
          light: '#34d399',
        },
        tertiary: {
          DEFAULT: '#f59e0b',
          dark: '#d97706',
          light: '#fbbf24',
        },
        surface: {
          DEFAULT: '#0e131f',
          dim: '#0e131f',
          bright: '#343946',
          container: {
            lowest: '#080e1a',
            low: '#161c28',
            DEFAULT: '#1a202c',
            high: '#242a36',
            highest: '#2f3542',
          },
          card: '#111827',
          variant: '#2f3542',
        },
        error: {
          DEFAULT: '#EF4444',
          container: '#93000a',
        },
        'border-muted': '#1F2937',
        'text-muted': '#6B7280',
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
      },
      borderRadius: {
        'sm': '0.25rem',
        'DEFAULT': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.5rem',
        '2xl': '16px',
      },
      backdropBlur: {
        'sm': '4px',
        'md': '12px',
        'lg': '16px',
        'xl': '32px',
      }
    },
  },
  plugins: [],
}
