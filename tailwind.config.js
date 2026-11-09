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
        // Design System Tokens (Mapped from CSS Variables with --alsm- prefix)
        bg: 'var(--alsm-bg)',
        surface: 'var(--alsm-surface)',
        border: 'var(--alsm-border)',
        'input-border': 'var(--alsm-input-border)',
        text: 'var(--alsm-text)',
        'text-muted': 'var(--alsm-text-muted)',
        primary: {
          DEFAULT: 'var(--alsm-primary)',
          hover: 'var(--alsm-primary-hover)',
          soft: 'var(--alsm-primary-soft)',
        },
        panel: {
          bgTop: 'var(--alsm-panel-bg-top)',
          bgBottom: 'var(--alsm-panel-bg-bottom)',
          border: 'var(--alsm-panel-border)',
          boxBg: 'var(--alsm-panel-box-bg)',
          text: 'var(--alsm-panel-text)',
          muted: 'var(--alsm-panel-muted)',
        },
        accent: 'var(--alsm-accent)',
        danger: 'var(--alsm-danger)',
        success: 'var(--alsm-success)',
        // Corporate Enterprise Design System (ALSM Web2 Admin Inheritance - Meridian ERP Reference)
        corporate: {
          sidebar: 'var(--alsm-sidebar-bg, #14263F)',
          sidebarHover: 'var(--alsm-sidebar-hover, #203954)',
          sidebarActive: 'var(--alsm-sidebar-active, #29466A)',
          workspace: 'var(--alsm-workspace-bg, #EEF1F6)',
          header: 'var(--alsm-header-bg, #FFFFFF)',
          card: 'var(--alsm-card-bg, #FFFFFF)',
          primary: 'var(--alsm-corporate-primary, #244A70)',
          primaryHover: 'var(--alsm-corporate-primary-hover, #1B3856)',
          primaryActive: 'var(--alsm-corporate-primary-active, #13283E)',
          textPrimary: 'var(--alsm-text-primary, #17263A)',
          textSecondary: 'var(--alsm-text-secondary, #8491A3)',
          border: 'var(--alsm-corporate-border, #DCE3EC)',
          borderSubtle: 'var(--alsm-border-subtle, #E8EDF4)',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"IBM Plex Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['"Inter"', '"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['"Inter"', '"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'Consolas', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'card': '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
        'panel': '0 10px 25px -5px rgba(0, 0, 0, 0.10), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}
