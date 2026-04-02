/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // PCL-CE Dark Theme Colors
        pcl: {
          bg: '#1A1A1A',
          card: '#1E1E1E',
          'card-hover': '#242424',
          border: '#3D3D3D',
          'semi-transparent': 'rgba(45,45,45,0.85)',
          'half-white': 'rgba(255,255,255,0.08)',
          highlight: '#3B82F6',
          'highlight-hover': '#2563EB',
          blue: '#3B82F6',
          yellow: '#E5A000',
          red: '#EF4444',
          gray1: '#3D3D3D',
          gray2: '#555555',
          gray3: '#8C7721',
          text: '#FFFFFF',
          'text-secondary': '#AAAAAA',
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
        pcl: '0 2px 8px rgba(0,0,0,0.3)',
        'pcl-card': '0 1px 3px rgba(0,0,0,0.2)',
      },
    },
  },
  plugins: [],
}
