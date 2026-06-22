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
        obsidian: {
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#1e1e1e', // Secondary obsidian dark background
          900: '#121212', // Primary obsidian dark background
          950: '#0a0a0a',
        },
        gold: {
          50: '#fdfbe9',
          100: '#faf7c7',
          200: '#f4ee90',
          300: '#eade4f',
          400: '#dec61b',
          500: '#cca43b', // Premium muted gold accent
          600: '#cca43b',
          700: '#8b6713',
          800: '#6f5014',
          900: '#5c4216',
          950: '#352309',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'Noto Sans Thai', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
