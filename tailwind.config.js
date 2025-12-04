/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
      },
      colors: {
        background: '#0f0a1e',
        surface: '#140f2d',
        primary: '#a855f7',
        secondary: '#06b6d4',
      }
    },
  },
  plugins: [],
}
