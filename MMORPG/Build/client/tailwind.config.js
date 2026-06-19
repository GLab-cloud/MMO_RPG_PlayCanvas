/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0a0e27',
          800: '#0f1438',
          700: '#151d3f',
          600: '#1a2447',
        },
        accent: {
          blue: '#3b82f6',
          cyan: '#06b6d4',
          purple: '#8b5cf6',
        },
      },
      fontFamily: {
        sans: ['Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
