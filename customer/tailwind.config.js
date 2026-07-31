/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Poppins for headings/display, Montserrat for body — swap freely per the brief.
        display: ['Poppins', 'sans-serif'],
        body: ['Montserrat', 'sans-serif'],
      },
      colors: {
        // Premium white + red palette. Token names (ink/ember/verify/cream/slate2)
        // are kept as-is so every existing component picks up the new palette
        // automatically — only the values changed.
        ink: { DEFAULT: '#1A1A1F', 2: '#242429', 3: '#2E2E35' },
        ember: { DEFAULT: '#E11D2E', dark: '#B4101F', light: '#FF4D5E' },
        verify: { DEFAULT: '#1F9D6C', bg: '#E6F5EE' },
        cream: '#FAFAFA',
        slate2: '#6B6B72',
      },
      backgroundImage: {
        'red-gradient': 'linear-gradient(135deg, #E11D2E 0%, #B4101F 100%)',
        'red-gradient-soft': 'linear-gradient(135deg, #FFF5F5 0%, #FFE5E7 100%)',
      },
      boxShadow: {
        card: '0 14px 32px rgba(225,29,46,0.10)',
        soft: '0 4px 14px rgba(26,26,31,0.06)',
      },
    },
  },
  plugins: [],
};
