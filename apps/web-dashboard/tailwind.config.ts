import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-out': { from: { opacity: '1' }, to: { opacity: '0' } },
        'zoom-in-95': { from: { transform: 'scale(0.95)' }, to: { transform: 'scale(1)' } },
        'zoom-out-95': { from: { transform: 'scale(1)' }, to: { transform: 'scale(0.95)' } },
      },
      animation: {
        'in': 'fade-in 150ms ease-out, zoom-in-95 150ms ease-out',
        'out': 'fade-out 150ms ease-in, zoom-out-95 150ms ease-in',
      },
    },
  },
  plugins: [
    function ({ addUtilities }: { addUtilities: Function }) {
      addUtilities({
        '.animate-in': { 'animation-name': 'fade-in, zoom-in-95', 'animation-duration': '150ms', 'animation-timing-function': 'ease-out' },
        '.fade-in-0': { '--tw-enter-opacity': '0' },
        '.zoom-in-95': { '--tw-enter-scale': '0.95' },
      });
    },
  ],
};

export default config;
