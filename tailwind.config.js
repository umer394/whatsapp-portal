/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'whatsapp-light-green': '#25D366',
        'whatsapp-dark-green': '#128C7E',
        'whatsapp-teal': '#00a884',
        'whatsapp-light-bg': '#F0F2F5',
        'whatsapp-chat-bg': '#E4DDD6',
        'whatsapp-message-out': '#D9FDD3',
        'whatsapp-message-in': '#FFFFFF',
      },
      keyframes: {
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          },
        }
      },
      animation: {
        'scan': 'scan 2s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.3s ease-out',
      },
    },
  },
  plugins: [],
} 