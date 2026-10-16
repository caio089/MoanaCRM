import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        white: 'rgb(var(--ui-contrast-rgb) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--surface-rgb) / <alpha-value>)',
          dim: 'rgb(var(--surface-dim-rgb) / <alpha-value>)',
          bright: 'rgb(var(--surface-bright-rgb) / <alpha-value>)',
          lowest: 'rgb(var(--surface-lowest-rgb) / <alpha-value>)',
          low: 'rgb(var(--surface-low-rgb) / <alpha-value>)',
          container: 'rgb(var(--surface-container-rgb) / <alpha-value>)',
          high: 'rgb(var(--surface-high-rgb) / <alpha-value>)',
          highest: 'rgb(var(--surface-highest-rgb) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--primary-rgb) / <alpha-value>)',
          container: 'rgb(var(--primary-container-rgb) / <alpha-value>)',
          dim: 'rgb(var(--primary-dim-rgb) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary-rgb) / <alpha-value>)',
          container: 'rgb(var(--secondary-container-rgb) / <alpha-value>)',
        },
        tertiary: {
          DEFAULT: 'rgb(var(--tertiary-rgb) / <alpha-value>)',
          container: 'rgb(var(--tertiary-container-rgb) / <alpha-value>)',
        },
        gold: {
          DEFAULT: 'rgb(var(--primary-rgb) / <alpha-value>)',
          dim: 'rgb(var(--primary-dim-rgb) / <alpha-value>)',
        },
        error: {
          DEFAULT: 'rgb(var(--error-rgb) / <alpha-value>)',
          container: 'rgb(var(--error-container-rgb) / <alpha-value>)',
        },
        outline: {
          DEFAULT: 'rgb(var(--outline-rgb) / <alpha-value>)',
          variant: 'rgb(var(--outline-variant-rgb) / <alpha-value>)',
        },
        'on-surface': 'rgb(var(--on-surface-rgb) / <alpha-value>)',
        'on-surface-variant': 'rgb(var(--on-surface-variant-rgb) / <alpha-value>)',
        'on-primary': 'rgb(var(--on-primary-rgb) / <alpha-value>)',
        'on-primary-container': 'rgb(var(--on-primary-container-rgb) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['DM Sans Variable', 'DM Sans', 'Avenir Next', 'system-ui', 'sans-serif'],
        display: ['Newsreader Variable', 'Newsreader', 'Iowan Old Style', 'Baskerville', 'Georgia', 'serif'],
      },
      fontSize: {
        'display-lg': ['3.7rem', { lineHeight: '0.94', letterSpacing: '-0.045em', fontWeight: '500' }],
        'headline-lg': ['2.65rem', { lineHeight: '1', letterSpacing: '-0.038em', fontWeight: '500' }],
        'headline-md': ['2.05rem', { lineHeight: '1.05', letterSpacing: '-0.032em', fontWeight: '500' }],
        'headline-sm': ['1.65rem', { lineHeight: '1.1', letterSpacing: '-0.026em', fontWeight: '500' }],
        'body-lg': ['1.0625rem', { lineHeight: '1.72', fontWeight: '430', letterSpacing: '-0.008em' }],
        'body-md': ['0.925rem', { lineHeight: '1.62', fontWeight: '430', letterSpacing: '-0.006em' }],
        'label-md': ['0.8125rem', { lineHeight: '1.45', fontWeight: '560', letterSpacing: '-0.002em' }],
        'label-sm': ['0.675rem', { lineHeight: '1.4', fontWeight: '680', letterSpacing: '0.085em' }],
      },
      borderRadius: {
        sm: '0.35rem',
        DEFAULT: '0.7rem',
        md: '0.9rem',
        lg: '1.15rem',
        xl: '1.6rem',
        full: '9999px',
      },
      boxShadow: {
        card: 'var(--card-shadow)',
        glow: '0 0 32px rgb(var(--primary-rgb) / 0.14)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, rgb(var(--primary-rgb)) 0%, rgb(var(--primary-dim-rgb)) 100%)',
        'gradient-area': 'linear-gradient(180deg, rgb(var(--primary-rgb) / 0.16) 0%, rgb(var(--primary-rgb) / 0) 100%)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.28s ease-out both',
      },
    },
  },
  plugins: [],
}

export default config
