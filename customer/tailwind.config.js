/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Poppins', 'sans-serif'],
        body: ['Montserrat', 'sans-serif'],
      },
      colors: {
        // Approved theme: white-dominant with a single red accent.
        // Token names kept stable (ink/ember/verify/cream/slate2) so the
        // rest of the app picks up the palette without per-file edits.
        ink: { DEFAULT: '#1C1C1E', 2: '#28282B', 3: '#333336' },
        ember: { DEFAULT: '#E11D2E', dark: '#B4101F', light: '#FF4D5E' },
        verify: { DEFAULT: '#1F9D6C', bg: '#E6F5EE' },
        cream: '#FAFAFA',
        slate2: '#6B6B72',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #E11D2E 0%, #B4101F 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, #FFF5F5 0%, #FFE5E7 100%)',
      },
      boxShadow: {
        card: '0 14px 32px rgba(225,29,46,0.10)',
        soft: '0 4px 14px rgba(28,28,30,0.06)',
      },
    },
  },
  plugins: [],
};
