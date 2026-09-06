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
        // Design System Tokens
        legacy: {
          bg: '#F7F9FC',
          textPrimary: '#091E42',
          textSecondary: '#42526E',
          primary: '#0652CC',
          electric: '#0655FF',
          softBlue: '#E8F1FF',
          cyan: '#22D3EE',
          violet: '#8B5CF6',
          border: '#D9E2EC',
          card: '#FFFFFF',
          darkBg: '#020817',
          darkSurface: '#091E42',
          darkFooter: '#06142E',
        },
        brand: {
          50: '#E8F1FF',
          100: '#D1E0FF',
          200: '#B2CCFF',
          300: '#84ADFF',
          400: '#528BFF',
          500: '#2970FF',
          600: '#0652CC', // Enterprise Blue Primary
          700: '#0655FF', // Electric Blue
          800: '#091E42', // Deep Navy
          900: '#020817', // Dark Section
          950: '#01040D',
        },
        primary: {
          DEFAULT: '#0652CC',
          hover: '#0655FF',
          light: '#E8F1FF',
        },
        surface: {
          bg: '#F7F9FC',
          card: '#FFFFFF',
          subtle: '#F8FAFC',
          muted: '#F1F5F9',
          dark: '#091E42',
        },
        enterprise: {
          border: '#D9E2EC',
          borderStrong: '#CBD5E1',
          textPrimary: '#091E42',
          textSecondary: '#42526E',
          textMuted: '#64748B',
        },
        modernizer: {
          accent: '#8B5CF6',
          cyan: '#22D3EE',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'card': '0 10px 30px rgba(9, 30, 66, 0.06)',
        'card-hover': '0 15px 40px rgba(6, 82, 204, 0.12)',
        'modal': '0 20px 60px rgba(9, 30, 66, 0.12)',
        'glow-blue': '0 0 30px rgba(6, 85, 255, 0.35)',
        'glow-cyan': '0 0 30px rgba(34, 211, 238, 0.35)',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.08)' },
        },
      },
      animation: {
        marquee: 'marquee 35s linear infinite',
        breathe: 'breathe 8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

