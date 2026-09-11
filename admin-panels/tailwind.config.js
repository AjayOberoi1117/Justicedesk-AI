/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        current: '#1a73e8',
        'justice-desk': '#d32f2f',
        'vakeel-sahib': '#7c3aed',
        'medideals': '#059669',
      },
    },
  },
  plugins: [],
}
