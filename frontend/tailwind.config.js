/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink:     '#0d0d14',
        panel:   '#15151f',
        panel2:  '#1a1a26',
        surface: '#11111a',
        line:    'rgba(139,92,246,0.14)',
        accent:  '#8B5CF6',
        accent2: '#C084FC',
        present: '#22C55E',
        onleave: '#F59E0B',
        absent:  '#EF4444',
      },
      fontFamily: {
        display: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans:    ['Inter',  'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:   '0 8px 32px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.05) inset',
        neum:   '6px 6px 16px rgba(0,0,0,0.55), -4px -4px 12px rgba(255,255,255,0.03)',
        glow:   '0 0 20px rgba(139,92,246,0.35)',
        'glow-sm': '0 0 10px rgba(139,92,246,0.25)',
      },
      backgroundImage: {
        'grad-accent':  'linear-gradient(135deg, #8B5CF6 0%, #C084FC 100%)',
        'grad-surface': 'linear-gradient(135deg, #15151f 0%, #1a1a26 100%)',
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '28px',
      },
      backdropBlur: {
        xs: '4px',
      },
    },
  },
  plugins: [],
};
