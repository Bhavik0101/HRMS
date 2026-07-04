/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0E0E12',
        panel: '#17171D',
        panel2: '#1E1E26',
        line: '#2A2A34',
        accent: '#8B5CF6',
        accent2: '#C084FC',
        present: '#22C55E',
        onleave: '#F59E0B',
        absent: '#EF4444',
      },
      fontFamily: {
        display: ['Georgia', 'ui-serif', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.35)',
      },
    },
  },
  plugins: [],
};
