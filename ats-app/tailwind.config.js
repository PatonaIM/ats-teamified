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
        brand: {
          purple: '#A16AE8',
          blue: '#8096FD',
        },
        // Employment type colors
        employment: {
          contract: '#3B82F6',
          partTime: '#10B981',
          fullTime: '#F59E0B',
          eor: '#A16AE8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
