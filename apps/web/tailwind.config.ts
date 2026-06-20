import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm editorial palette
        paper: '#F3ECE0',
        cream: '#FAF6EE',
        sand: '#E7DAC5',
        taupe: '#B7A488',
        ink: '#211A14',
        espresso: '#2C2219',
        cocoa: '#3D2F22',
        clay: '#B26A41',
        olive: '#4C5A40',
        muted: '#8C7C6A',
        line: '#D9CDBA',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.28em',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;
