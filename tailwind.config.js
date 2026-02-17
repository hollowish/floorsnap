/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Blueprint-inspired accent palette
        blueprint: {
          50: '#f0f5fa',
          100: '#dce6f2',
          200: '#b8cde5',
          300: '#8aaed3',
          400: '#5a8dbe',
          500: '#3b6fa3',
          600: '#2d5886',
          700: '#264869',
          800: '#233d57',
          900: '#1e3349',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
