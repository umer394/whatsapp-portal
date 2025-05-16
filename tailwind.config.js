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
        'whatsapp-teal': '#075E54',
        'whatsapp-light-bg': '#F0F2F5',
        'whatsapp-chat-bg': '#E4DDD6',
        'whatsapp-message-out': '#D9FDD3',
        'whatsapp-message-in': '#FFFFFF',
      },
      animation: {
        'scan': 'scan 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} 