export const tokens = {
  colors: {
    forest: '#173F35',
    sage: '#DCE9DF',
    ivory: '#F8F7F1',
    teal: '#6C9B8B',
    charcoal: '#25312E',
    amber: '#E8B968',
    white: '#FFFFFF',
    forestHover: '#13352D',
    sageLight: '#EEF4EF',
    charcoalMuted: '#52605C',
    amberLight: '#FDF7EB',
    amberText: '#875C0B',
  },
  typography: {
    fontFamily: {
      heading: "'Manrope', system-ui, sans-serif",
      body: "'Inter', system-ui, sans-serif",
    },
    // Scale: 14 / 16 / 18 / 24 / 32 / 40 px
    fontSize: {
      xs: '0.875rem',  // 14px
      sm: '1rem',      // 16px
      base: '1.125rem',// 18px (Elder default body)
      lg: '1.5rem',    // 24px
      xl: '2rem',      // 32px
      '2xl': '2.5rem', // 40px
    },
  },
  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    6: '24px',
    8: '32px',
    12: '48px',
    16: '64px',
  },
  radii: {
    control: '8px',
    card: '16px',
    modal: '24px',
  },
  shadows: {
    card: '0 2px 8px rgba(23, 63, 53, 0.08)',
    modal: '0 8px 24px rgba(23, 63, 53, 0.14)',
  },
  transitions: {
    fast: '150ms ease-out',
    normal: '200ms ease-out',
    screen: '250ms ease-out',
  },
} as const;

export type DesignTokens = typeof tokens;
