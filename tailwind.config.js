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
        brand: {
          50: '#EFF4FF',
          100: '#D1E0FF',
          200: '#B2CCFF',
          300: '#84ADFF',
          400: '#528BFF',
          500: '#2970FF',
          600: '#175CD3', // Enterprise Blue Primary
          700: '#1849A9', // Enterprise Blue Hover
          800: '#153B8A',
          900: '#112B66',
          950: '#0A1B42',
        },
        primary: {
          DEFAULT: '#175CD3',
          hover: '#1849A9',
          light: '#EFF4FF',
        },
        surface: {
          bg: '#F7F9FC',
          card: '#FFFFFF',
          subtle: '#F8FAFC',
          muted: '#F1F5F9',
        },
        enterprise: {
          border: '#E2E8F0',
          borderStrong: '#CBD5E1',
          textPrimary: '#0F172A',
          textSecondary: '#475569',
          textMuted: '#64748B',
        },
        modernizer: {
          accent: '#6938EF',
          cyan: '#0284C7',
          emerald: '#079455',
          amber: '#DC6803',
          rose: '#D92D20',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(16, 24, 40, 0.1), 0 1px 2px -1px rgba(16, 24, 40, 0.1)',
        'modal': '0 20px 24px -4px rgba(16, 24, 40, 0.08), 0 8px 8px -4px rgba(16, 24, 40, 0.03)',
      }
    },
  },
  plugins: [],
}

