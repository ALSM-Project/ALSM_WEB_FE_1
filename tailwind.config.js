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
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
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
