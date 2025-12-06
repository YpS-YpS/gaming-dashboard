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
        'brand-dark': '#000814',
        'brand-purple': '#2e1065',
        'brand-violet': '#7c3aed',
        'brand-cyan': '#00C7FD',
        'brand-pink': '#d946ef',
      },
      keyframes: {
        kenburns: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.25)' },
        }
      },
      animation: {
        kenburns: 'kenburns 20s ease-in-out infinite alternate',
      }
    },
  },
  plugins: [],
}
