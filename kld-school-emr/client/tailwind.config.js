/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        kld: {
          50: '#edf8f2', 100: '#d5efdf', 200: '#afe0c5', 300: '#7ccaa5',
          400: '#45ad7f', 500: '#238f63', 600: '#0A5C36', 700: '#084b2d',
          800: '#083d27', 900: '#073321', 950: '#031d13'
        },
        accent: '#FCD116'
      },
      boxShadow: {
        soft: '0 18px 55px -28px rgba(2, 44, 26, .35)',
        glow: '0 0 40px rgba(252, 209, 22, .16)'
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] }
    }
  },
  plugins: []
};
