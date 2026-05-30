/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#e94560',
        secondary: '#00b894',
        dark: {
          100: '#1a1a2e',
          200: '#16213e',
          300: '#0f3460',
        }
      }
    },
  },
  plugins: [],
}