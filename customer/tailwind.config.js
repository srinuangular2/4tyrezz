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
        // Approved theme: white-dominant with a single blue accent (#3083ff).
        // Token names kept stable (ink/ember/verify/cream/slate2) so the
        // rest of the app picks up the palette without per-file edits.
        ink: { DEFAULT: '#0F172A', 2: '#1E293B', 3: '#334155' },
        brand: { DEFAULT: '#3083ff', dark: '#1853ff', light: '#6BA6FF', soft: '#EAF2FF' },
        ember: { DEFAULT: '#3083ff', dark: '#1853ff', light: '#6BA6FF' },
        verify: { DEFAULT: '#1F9D6C', bg: '#E6F5EE' },
        cream: '#FAFAFA',
        slate2: '#64748B',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #3083ff 0%, #1853ff 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, #F2F7FF 0%, #E2EDFF 100%)',
        'brand-beam': 'linear-gradient(90deg, #22d3ee 0%, #3083ff 50%, #6366f1 100%)',
      },
      boxShadow: {
        card: '0 14px 32px rgba(48,131,255,0.12)',
        soft: '0 4px 14px rgba(15,23,42,0.06)',
        glass: '0 8px 32px 0 rgba(31,38,135,0.06)',
        'glass-hover': '0 20px 40px 0 rgba(48,131,255,0.18)',
      },
    },
  },
  plugins: [],
};
