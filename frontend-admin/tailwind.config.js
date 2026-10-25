import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        heading: ['"Instrument Serif"', 'Georgia', '"Times New Roman"', 'serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // Warm neutrals: every existing `slate-*` class in the app now renders as stone,
        // so pages pick up the warm palette without touching their markup.
        slate: colors.stone,

        // `<alpha-value>` enables opacity modifiers such as bg-primary/10 or ring-ring/20
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
          foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar) / <alpha-value>)',
          foreground: 'hsl(var(--sidebar-foreground) / <alpha-value>)',
          deep: 'hsl(var(--sidebar-deep) / <alpha-value>)',
          soft: 'hsl(var(--sidebar-soft) / <alpha-value>)',
          muted: 'hsl(var(--sidebar-muted) / <alpha-value>)',
          accent: 'hsl(var(--sidebar-accent) / <alpha-value>)',
          border: 'hsl(var(--sidebar-border) / <alpha-value>)',
        },
        // Reference palette, available by name
        forest: { DEFAULT: '#0A2E36', deep: '#061D23', soft: '#14505C' },
        sand: { DEFAULT: '#F4EFE6', head: '#FAF6EE' },
        sage: { DEFAULT: '#D3EAE5', soft: '#EDF6F3' },
        terracotta: { DEFAULT: '#FF6B4A', dark: '#D9482A' },
        status: { ok: '#2F7A5A', warn: '#B7791F', bad: '#B5473A', neutral: '#8A8F88' },
        brand: {
          DEFAULT: '#0f172a',
          emerald: '#059669',
          coral: '#f97316',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        // Hairline lift for cards and inputs — barely there
        xs: '0 1px 2px 0 rgb(6 29 35 / 0.04)',
        card: '0 1px 2px 0 rgb(6 29 35 / 0.03)',
        pop: '0 18px 40px rgba(6, 29, 35, 0.12)',
        dialog: '0 40px 90px rgba(6, 29, 35, 0.28)',
        'btn-primary': '0 8px 18px -8px rgba(10, 46, 54, 0.7)',
        'btn-accent': '0 8px 18px -8px rgba(255, 107, 74, 0.8)',
      },
    },
  },
  plugins: [],
};
