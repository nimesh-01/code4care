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
        // Primary coral/peach colors from the template
        coral: {
          50: '#fff5f3',
          100: '#ffe8e3',
          200: '#ffd5cc',
          300: '#ffb5a6',
          400: '#ff8c75',
          500: '#f86f4d',
          600: '#e55a3a',
          700: '#c04829',
          800: '#9d3d25',
          900: '#823725',
        },
        // Teal accent
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        // Cream/off-white background
        cream: {
          50: '#fefdfb',
          100: '#fdf8f3',
          200: '#faf3eb',
          300: '#f5e6d8',
          400: '#edd5c0',
          500: '#e2c1a5',
        },
        // Dark mode colors
        dark: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#0a0f1a',
        },
        // Legacy soul colors
        soul: {
          coral: '#f86f4d',
          teal: '#0d9488',
          cream: '#fdf8f3',
          gold: '#d4a574',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        playfair: ['Playfair Display', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'heart-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 54c-1 0-2-.3-2.8-1C24.5 51 6 35.5 6 21c0-9.4 7.6-17 17-17 5.3 0 10.2 2.5 13.4 6.7L30 17.5l-6.4-6.8C26.8 7.5 31.7 5 37 5c9.4 0 17 7.6 17 17 0 14.5-18.5 30-21.2 32-.8.7-1.8 1-2.8 1z' fill='%23f86f4d' fill-opacity='0.03'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}
