/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dde6ff',
          200: '#c3d0ff',
          300: '#9db0ff',
          400: '#7585fc',
          500: '#5a63f8',
          600: '#4644ed',
          700: '#3b36d2',
          800: '#302eaa',
          900: '#2c2c87',
        },
        // ── Theme tokens ──────────────────────────────
        surface: {
          DEFAULT: 'var(--color-surface)',
          2: 'var(--color-surface-2)',
        },
        panel: 'var(--color-panel)',
        'th-border': {
          DEFAULT: 'var(--color-border)',
          light: 'var(--color-border-light)',
        },
        'th-text': {
          primary:   'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted:     'var(--color-text-muted)',
        },
        'th-accent': {
          DEFAULT: 'var(--color-accent)',
          hover:   'var(--color-accent-hover)',
          subtle:  'var(--color-accent-subtle)',
          2:       'var(--color-accent-2)',
        },
      },
      fontFamily: {
        sans: ['var(--font-main)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
