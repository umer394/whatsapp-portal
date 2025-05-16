import { Chat, Message } from '../types';
import { v4 as uuidv4 } from 'uuid';
import mockUsers from './mockUsers';
import { formatDistance } from 'date-fns';

// Helper function to create mock messages
const createMockMessages = (chatId: string, count: number = 10): Message[] => {
  const messages: Message[] = [];
  const currentUser = mockUsers[0];
  
  // Get other participants (not the current user)
  const otherParticipants = mockUsers.filter(user => user.id !== currentUser.id);
  
  for (let i = 0; i < count; i++) {
    const isFromCurrentUser = i % 2 === 0;
    const sender = isFromCurrentUser ? currentUser : otherParticipants[i % otherParticipants.length];
    
    // Create message timestamp (older messages first)
    const timestamp = new Date();
    timestamp.setMinutes(timestamp.getMinutes() - (count - i) * 5); // 5-minute intervals
    
    // For the last message, use different types occasionally
    let type: 'text' | 'image' | 'audio' | 'file' = 'text';
    let content = `This is message #${i + 1}`;
    let fileUrl, fileName, fileSize;
    
    if (i === count - 1 && i % 4 === 0) {
      type = 'image';
      content = 'Photo';
      fileUrl = 'https://picsum.photos/500/300';
      fileName = 'image.jpg';
      fileSize = 256000;
    } else if (i === count - 2 && i % 5 === 0) {
      type = 'file';
      content = 'Document';
      fileUrl = '#';
      fileName = 'document.pdf';
      fileSize = 1024000;
    } else if (i === count - 3 && i % 7 === 0) {
      type = 'audio';
      content = 'Voice message';
      fileUrl = '#';
      fileName = 'audio.mp3';
      fileSize = 512000;
    }
    
    messages.push({
      id: uuidv4(),
      content,
      senderId: sender.id,
      chatId,
      timestamp,
      read: isFromCurrentUser || i < count - 3,
      delivered: isFromCurrentUser || i < count - 1,
      type,
      fileUrl,
      fileName,
      fileSize,
    });
  }
  
  return messages;
};

// Helper to create a specific chat with a custom last message
const createCustomChat = (
  participants: typeof mockUsers,
  lastMessageContent: string,
  isGroup: boolean = false,
  name?: string,
  avatar?: string,
  unreadCount: number = 0,
  customTimestamp?: Date
): Chat => {
  const chatId = uuidv4();
  const messages = createMockMessages(chatId, 15);
  
  // Override the last message
  const lastMessageIndex = messages.length - 1;
  messages[lastMessageIndex].content = lastMessageContent;
  
  // If custom timestamp, use it
  if (customTimestamp) {
    messages[lastMessageIndex].timestamp = customTimestamp;
  }
  
  return {
    id: chatId,
    participants,
    messages,
    lastMessage: messages[lastMessageIndex],
    unreadCount,
    isGroup,
    name,
    avatar,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    ...(isGroup && {
      createdBy: participants[1].id,
      admins: [participants[1].id, participants[0].id],
    }),
  };
};

// Create custom times for demo
const getTime = (hours: number, minutes: number) => {
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);
  date.setSeconds(0);
  return date;
};

// Create mock chats
const mockChats: Chat[] = [
  // Medical Chat (Times Medico)
  createCustomChat(
    [mockUsers[0], {
      id: uuidv4(),
      name: 'Times Medico',
      phoneNumber: '+923001234567',
      avatar: 'https://via.placeholder.com/40?text=TM',
      status: 'Available',
      about: 'Medical Services',
      isOnline: true,
    }],
    'TODAY INSHAALLAH.... TIME NOT CONFIRM ....RIDER WILL CALL BEFORE ARRIVING',
    false,
    undefined,
    undefined,
    0,
    getTime(12, 1)
  ),
  // MySkool-AFCA
  createCustomChat(
    [mockUsers[0], {
      id: uuidv4(),
      name: 'MySkool-AFCA',
      phoneNumber: '+923001234568',
      avatar: 'https://via.placeholder.com/40?text=MS',
      status: 'Available',
      about: 'Education Portal',
      isOnline: false,
    }],
    'Hamza Alvi AFCA: We are facing issues with o...',
    false,
    undefined,
    undefined,
    0,
    getTime(13, 5)
  ),
  // EGHS - Primary Updates 26
  createCustomChat(
    [mockUsers[0], {
      id: uuidv4(),
      name: 'EGHS - Primary Updates 26',
      phoneNumber: '+923001234569',
      avatar: 'https://via.placeholder.com/40?text=EG',
      status: 'School updates',
      about: 'Primary School Updates',
      isOnline: false,
    }],
    'This message was deleted',
    false,
    undefined,
    undefined,
    0,
    getTime(14, 30)
  ),
  // Public School Shams
  createCustomChat(
    [mockUsers[0], {
      id: uuidv4(),
      name: 'Public School Shams',
      phoneNumber: '+923001234570',
      avatar: 'https://via.placeholder.com/40?text=PS',
      status: 'Available',
      about: 'School Administration',
      isOnline: true,
    }],
    'public-challan.pdf · 1 page',
    false,
    undefined,
    undefined,
    0,
    getTime(15, 45)
  ),
  // MnM WhatsApp
  createCustomChat(
    [mockUsers[0], {
      id: uuidv4(),
      name: 'MnM WhatsApp',
      phoneNumber: '+923001234571',
      avatar: 'https://via.placeholder.com/40?text=MM',
      status: 'Available',
      about: 'MnM Official',
      isOnline: true,
    }],
    'Respected Parents and Dear Students, ...',
    false,
    undefined,
    undefined,
    3,
    getTime(16, 20)
  ),
  // Athar
  createCustomChat(
    [mockUsers[0], {
      id: uuidv4(),
      name: 'Athar',
      phoneNumber: '+923001234572',
      avatar: 'https://via.placeholder.com/40?text=A',
      status: 'Busy',
      about: 'At work',
      isOnline: false,
    }],
    'Dear Muhammad Ali, You are Late on 12-May-20...',
    false,
    undefined,
    undefined,
    0,
    getTime(17, 15)
  ),
  // +92 343 8187455
  createCustomChat(
    [mockUsers[0], {
      id: uuidv4(),
      name: '+92 343 8187455',
      phoneNumber: '+923438187455',
      avatar: 'https://via.placeholder.com/40?text=+92',
      status: 'Available',
      about: 'Hey there! I am using WhatsApp',
      isOnline: true,
    }],
    'This message was deleted',
    false,
    undefined,
    undefined,
    2,
    getTime(18, 30)
  ),
  // MySkool - MnM School
  createCustomChat(
    [mockUsers[0], {
      id: uuidv4(),
      name: 'MySkool - MnM School',
      phoneNumber: '+923001234574',
      avatar: 'https://via.placeholder.com/40?text=MS',
      status: 'Available',
      about: 'School Portal',
      isOnline: false,
    }],
    'Latest updates from school',
    false,
    undefined,
    undefined,
    0,
    getTime(19, 45)
  ),
  // Group chat
  createCustomChat(
    [mockUsers[0], mockUsers[1], mockUsers[2], mockUsers[3]],
    'Let\'s meet tomorrow at 10 AM',
    true,
    'Friends Group',
    'https://via.placeholder.com/40?text=FG',
    5,
    getTime(14, 15)
  ),
  // Work group
  createCustomChat(
    [mockUsers[0], mockUsers[2], mockUsers[4]],
    'Project deadline is next Friday',
    true,
    'Work Team',
    'https://via.placeholder.com/40?text=WT',
    0,
    getTime(17, 30)
  ),
];

// Special setup for Times Medico chat to match the screenshot
const timesMedicoChat = mockChats[0];
if (timesMedicoChat) {
  // Add the specific conversation from the screenshot
  const specialMessages: Message[] = [
    {
      id: uuidv4(),
      content: 'Done',
      senderId: timesMedicoChat.participants[1].id, // Times Medico
      chatId: timesMedicoChat.id,
      timestamp: getTime(12, 2),
      read: true,
      delivered: true,
      type: 'text',
    },
    {
      id: uuidv4(),
      content: 'TODAY INSHAALLAH.... TIME NOT CONFIRM ....RIDER WILL CALL BEFORE ARRIVING',
      senderId: timesMedicoChat.participants[1].id, // Times Medico
      chatId: timesMedicoChat.id,
      timestamp: getTime(12, 2),
      read: true,
      delivered: true,
      type: 'text',
    },
    {
      id: uuidv4(),
      content: 'Kb tk deliver hoga?',
      senderId: mockUsers[0].id, // Current user
      chatId: timesMedicoChat.id,
      timestamp: getTime(15, 47),
      read: true,
      delivered: true,
      type: 'text',
    },
    {
      id: uuidv4(),
      content: 'Plz share rider number',
      senderId: mockUsers[0].id, // Current user
      chatId: timesMedicoChat.id,
      timestamp: getTime(15, 48),
      read: true,
      delivered: true,
      type: 'text',
    },
    {
      id: uuidv4(),
      content: '.',
      senderId: timesMedicoChat.participants[1].id, // Times Medico
      chatId: timesMedicoChat.id,
      timestamp: getTime(15, 58),
      read: true,
      delivered: true,
      type: 'text',
    },
    {
      id: uuidv4(),
      content: 'TODAY INSHAALLAH.... TIME NOT CONFIRM ....RIDER WILL CALL BEFORE ARRIVING',
      senderId: timesMedicoChat.participants[1].id, // Times Medico
      chatId: timesMedicoChat.id,
      timestamp: getTime(15, 58),
      read: true,
      delivered: true,
      type: 'text',
    },
    {
      id: uuidv4(),
      content: 'Please send by 5PM I\'m waiting',
      senderId: mockUsers[0].id, // Current user
      chatId: timesMedicoChat.id,
      timestamp: getTime(16, 8),
      read: true,
      delivered: true,
      type: 'text',
    },
    {
      id: uuidv4(),
      content: '0314-8103403',
      senderId: timesMedicoChat.participants[1].id, // Times Medico
      chatId: timesMedicoChat.id,
      timestamp: getTime(16, 20),
      read: true,
      delivered: true,
      type: 'text',
    },
    {
      id: uuidv4(),
      content: 'Mudasir rider',
      senderId: timesMedicoChat.participants[1].id, // Times Medico
      chatId: timesMedicoChat.id,
      timestamp: getTime(16, 20),
      read: true,
      delivered: true,
      type: 'text',
    },
    {
      id: uuidv4(),
      content: 'Please cordinate',
      senderId: timesMedicoChat.participants[1].id, // Times Medico
      chatId: timesMedicoChat.id,
      timestamp: getTime(16, 20),
      read: true,
      delivered: true,
      type: 'text',
    },
    {
      id: uuidv4(),
      content: 'Ok',
      senderId: mockUsers[0].id, // Current user
      chatId: timesMedicoChat.id,
      timestamp: getTime(16, 27),
      read: true,
      delivered: true,
      type: 'text',
    },
  ];
  
  // Replace the messages with these special ones
  timesMedicoChat.messages = specialMessages;
  timesMedicoChat.lastMessage = specialMessages[specialMessages.length - 1];
}

export default mockChats; 