/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0F172A',
          card: '#1E293B',
          border: '#334155',
          blue: '#2563EB',
          red: '#DC2626',
          yellow: '#D97706',
          green: '#16A34A',
        }
      }
    },
  },
  plugins: [],
}
