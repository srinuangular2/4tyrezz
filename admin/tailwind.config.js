/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { 
        // Overriding 'sans' sets Montserrat as the global default font across the entire app
        sans: ['Montserrat', 'sans-serif'],
        display: ['Poppins', 'sans-serif'], 
        body: ['Montserrat', 'sans-serif'] 
      },
      colors: {
        ink: { DEFAULT: '#1C1C1E', 2: '#28282B' },
        ember: { DEFAULT: '#3083ff', dark: '#1853ff' },
        verify: { DEFAULT: '#1F9D6C', bg: '#E6F5EE' },
        cream: '#FAFAFA',
        slate2: '#6B6B72',
      },
    },
  },
  plugins: [],
};