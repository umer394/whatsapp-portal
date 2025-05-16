# WhatsApp Web Clone

A frontend clone of WhatsApp Web built with React, TypeScript and Tailwind CSS.

## Features

- **Responsive UI**: Mimics the WhatsApp Web interface with attention to detail
- **Real-time Messaging Simulation**: Simulates sending and receiving messages
- **QR Code Login**: Simulated login process through QR code scanning
- **Chat History**: View and search conversation history
- **Media Support**: Send and view images, documents, and audio messages
- **Dark Mode**: Toggle between light and dark themes
- **Profile Management**: Update profile picture, name, and status
- **Read Receipts**: Shows message delivery and read status
- **Group Chats**: Create and manage group conversations
- **Typing Indicators**: Shows when someone is typing
- **Online Status**: Indicates when contacts are online

## Tech Stack

- **React.js**: Frontend UI library
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Navigation
- **date-fns**: Date formatting
- **emoji-picker-react**: Emoji selection component
- **React Icons**: Icon components

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/whatsapp-web-clone.git
   cd whatsapp-web-clone
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Project Structure

```
src/
├── components/       # UI components
├── context/          # React context API
├── data/             # Mock data
├── pages/            # Page components
├── types/            # TypeScript interfaces
├── App.tsx           # Main app component
└── index.tsx         # Entry point
```

## Development Notes

- This is a frontend-only application with simulated backend functionality
- All data is stored in memory and resets on page refresh
- User authentication is simulated (no actual server communication)
- The app uses mock data to simulate conversations and contacts

## Future Improvements

- Add WebSocket integration for true real-time communication
- Implement persistent storage with local storage or IndexedDB
- Add voice and video calling features
- Implement message search functionality
- Add end-to-end encryption simulation
- Add responsive design for mobile devices

## License

MIT
