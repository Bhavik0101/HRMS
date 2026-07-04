/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink:     'var(--t-bg)',
        panel:   'var(--t-surface)',
        panel2:  'var(--t-surface2)',
        surface: 'var(--t-bg2)',
        line:    'var(--t-border)',
        accent:  'var(--t-accent-p)',
        accent2: 'var(--t-accent-s)',
        present: '#10B981', // Professional Green
        onleave: '#F59E0B', // Amber
        absent:  '#EF4444', // Red
      },
      fontFamily: {
        display: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans:    ['Inter',  'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:   '0 8px 32px var(--t-card-shadow), 0 1px 0 rgba(255,255,255,0.05) inset',
        neum:   '6px 6px 16px var(--t-neum-drk), -4px -4px 12px var(--t-neum-lit)',
        glow:   '0 0 20px var(--t-accent-glow)',
        'glow-sm': '0 0 10px var(--t-accent-glow-sm)',
      },
      backgroundImage: {
        'grad-accent':  'var(--t-accent-grad)',
        'grad-surface': 'linear-gradient(135deg, var(--t-surface) 0%, var(--t-surface2) 100%)',
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
