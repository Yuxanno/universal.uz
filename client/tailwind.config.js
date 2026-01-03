/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#f8f9fa',
          800: '#ffffff',
          700: '#ffffff',
          600: '#e9ecef',
          500: '#dee2e6'
        },
        primary: {
          500: '#dc2626',
          600: '#b91c1c'
        }
      }
    }
  },
  plugins: []
}
