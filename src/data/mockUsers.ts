import { User } from '../types';
import { v4 as uuidv4 } from 'uuid';

const mockUsers: User[] = [
  {
    id: uuidv4(),
    name: 'John Doe',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    status: 'Hey there! I am using WhatsApp',
    phone: '+1234567890',
    isOnline: true,
    lastSeen: new Date(),
  },
  {
    id: uuidv4(),
    name: 'Jane Smith',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    status: 'Available',
    phone: '+1987654321',
    isOnline: false,
    lastSeen: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
  },
  {
    id: uuidv4(),
    name: 'Robert Johnson',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
    status: 'At work',
    phone: '+1122334455',
    isOnline: false,
    lastSeen: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
  },
  {
    id: uuidv4(),
    name: 'Emily Davis',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    status: 'Busy',
    phone: '+1555666777',
    isOnline: true,
    lastSeen: new Date(),
  },
  {
    id: uuidv4(),
    name: 'Michael Wilson',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    status: 'In a meeting',
    phone: '+1999888777',
    isOnline: false,
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
];

export default mockUsers; 