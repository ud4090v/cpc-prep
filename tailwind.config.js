/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0077B6',
        'primary-dark': '#005f8f',
        success: '#2D9E4A',
        error: '#D62828',
        bg: '#F8F9FA',
        text: '#1A1A2E',
      },
    },
  },
  plugins: [],
}
