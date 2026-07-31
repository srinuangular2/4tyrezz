/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { display: ['"Big Shoulders Display"', 'sans-serif'], body: ['Inter', 'sans-serif'] },
      colors: {
        ink: { DEFAULT: '#0D1B4C', 2: '#16225E' },
        ember: { DEFAULT: '#E8491D', dark: '#C93912' },
        verify: { DEFAULT: '#1F9D6C', bg: '#E6F5EE' },
        cream: '#F4F5F9',
        slate2: '#5B6478',
      },
    },
  },
  plugins: [],
};
