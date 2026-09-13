/**
 * ALSM Web1 Public Theme Tokens
 * Unified Pure White Color Palette matching the Public Main Page
 */
export const web1PublicTheme = {
  name: 'ALSM Web1 Public Theme (Pure White)',
  colors: {
    primary: {
      default: '#0652CC',
      hover: '#0655FF',
      light: '#E8F1FF',
      dark: '#043CA1',
      ring: 'rgba(6, 82, 204, 0.25)',
    },
    secondary: {
      default: '#091E42',
      hover: '#020817',
      light: '#F4F5F7',
    },
    accent: {
      cyan: '#22D3EE',
      violet: '#8B5CF6',
    },
    background: {
      main: '#FFFFFF', // Pure White matching main landing page background
      subtle: '#FFFFFF',
      dark: '#020817',
      sidebar: '#FFFFFF', // Light Clean Sidebar matching main page topbar
    },
    surface: {
      card: '#FFFFFF',
      cardHover: '#FAFCFF',
      darkCard: '#091E42',
      modal: '#FFFFFF',
    },
    text: {
      primary: '#091E42',
      secondary: '#42526E',
      muted: '#6B778C',
      inverse: '#FFFFFF',
      brand: '#0652CC',
    },
    border: {
      default: '#E5EAF0',
      light: '#F0F4F8',
      strong: '#D9E2EC',
      brand: '#0652CC',
    },
    status: {
      success: {
        bg: '#ECFDF5',
        text: '#065F46',
        border: '#A7F3D0',
        dot: '#10B981',
      },
      warning: {
        bg: '#FFFBEB',
        text: '#92400E',
        border: '#FDE68A',
        dot: '#F59E0B',
      },
      error: {
        bg: '#FEF2F2',
        text: '#991B1B',
        border: '#FECACA',
        dot: '#EF4444',
      },
      info: {
        bg: '#E8F1FF',
        text: '#0652CC',
        border: '#B2CCFF',
        dot: '#0652CC',
      },
    },
  },
  shadows: {
    card: '0 4px 20px rgba(9, 30, 66, 0.04)',
    cardHover: '0 10px 30px rgba(6, 82, 204, 0.08)',
    modal: '0 20px 60px rgba(9, 30, 66, 0.12)',
  },
};

export type Web1Theme = typeof web1PublicTheme;
export default web1PublicTheme;
