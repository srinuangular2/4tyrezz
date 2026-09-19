/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        body: ['Poppins', 'sans-serif'],
        display: ['Montserrat', 'sans-serif'],
      },
      colors: {
        ink: { DEFAULT: '#0F172A', 2: '#1E293B', 3: '#334155' },
        brand: { DEFAULT: '#3083ff', dark: '#1853ff', light: '#6BA6FF', soft: '#EAF2FF' },
        ember: { DEFAULT: '#3083ff', dark: '#1853ff', light: '#6BA6FF' },
        verify: { DEFAULT: '#1F9D6C', bg: '#E6F5EE' },
        cream: '#FAFAFA',
        slate2: '#64748B',
      },
    },
  },
  plugins: [],
};
