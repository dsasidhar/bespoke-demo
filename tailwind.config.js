/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d4d8e0',
          300: '#aab0bd',
          400: '#7a8294',
          500: '#525a6c',
          600: '#3a4256',
          700: '#252c3f',
          800: '#161c2c',
          900: '#0c111d',
          950: '#070a13',
        },
        cocoa: {
          50: '#fbf6f1',
          100: '#f3e7d8',
          200: '#e6cdb1',
          300: '#d4ad84',
          400: '#c08c5d',
          500: '#a87044',
          600: '#8b5836',
          700: '#6d432b',
          800: '#502f1f',
          900: '#321d12',
        },
        accent: {
          DEFAULT: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(12,17,29,0.04), 0 4px 16px rgba(12,17,29,0.06)',
      },
    },
  },
  plugins: [],
}
