/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        pcl: {
          bg: 'var(--color-bg)',
          card: 'var(--color-card)',
          'card-hover': 'var(--color-card-hover)',
          border: 'var(--color-border)',
          'semi-transparent': 'var(--color-semi-transparent)',
          'half-white': 'var(--color-half-white)',
          highlight: 'var(--color-highlight)',
          'highlight-hover': 'var(--color-highlight-hover)',
          blue: 'var(--color-blue)',
          yellow: 'var(--color-yellow)',
          red: 'var(--color-red)',
          gray1: 'var(--color-gray1)',
          gray2: 'var(--color-gray2)',
          gray3: 'var(--color-gray3)',
          text: 'var(--color-text)',
          'text-secondary': 'var(--color-text-secondary)',
        },
      },
      fontFamily: {
        pcl: ['"Microsoft YaHei"', '"PingFang SC"', '"Segoe UI"', 'sans-serif'],
      },
      borderRadius: {
        pcl: '6px',
        pclBtn: '3px',
      },
      boxShadow: {
        pcl: '0 2px 8px var(--shadow-color)',
        'pcl-card': '0 1px 3px var(--shadow-color)',
      },
    },
  },
  plugins: [],
}
