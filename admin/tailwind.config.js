/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { display: ['Poppins', 'sans-serif'], body: ['Montserrat', 'sans-serif'] },
      colors: {
        ink: { DEFAULT: '#1C1C1E', 2: '#28282B' },
        ember: { DEFAULT: '#E11D2E', dark: '#B4101F' },
        verify: { DEFAULT: '#1F9D6C', bg: '#E6F5EE' },
        cream: '#FAFAFA',
        slate2: '#6B6B72',
      },
    },
  },
  plugins: [],
};
