export interface User {
  id: string | number;
  name: string;
  avatar?: string;
  status?: string;
  phone?: string;
  phoneNumber?: string;
  about?: string;
  isOnline?: boolean;
  lastSeen?: Date;
  email?: string;
  apiKey?: string;
  clientID?: string;
  cID?: string;
  countryCode?: string;
  whatsappNumber?: string;
  formattedWhatsappNumber?: string;
  role?: string;
  businessID?: number;
  instance?: {
    id: number;
    instance: string;
    title: string;
    state: string;
  };
}

export interface Contact {
  id: number;
  firstName: string;
  middleName: string;
  lastName: string;
  organizationName: string;
  organizationTitle: string;
  emailValue: string;
  phone1Value: string;
  phone2Value: string;
  phone3Value: string;
  labels: string;
  businessID: number;
  userID: number;
  isActive: boolean;
  metaAddedBy: string;
  metaUpdatedBy: string;
  addedOn: string;
  updatedOn: string;
}

export interface ContactsResponse {
  status: string;
  message: string;
  data: {
    items: Contact[];
    pagination: {
      totalCount: number;
      pageSize: number;
      currentPage: number;
      totalPages: number;
      hasNext: boolean;
      hasPrevious: boolean;
    }
  };
  serverTime: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string | number;
  receiverId?: string | number; // For direct messages
  chatId: string;
  timestamp: Date;
  read: boolean;
  delivered: boolean;
  type: 'text' | 'image' | 'audio' | 'file';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

export interface Chat {
  id: string;
  name?: string; // For group chats
  avatar?: string; // For group chats
  participants: User[];
  messages: Message[];
  unreadCount: number;
  isGroup: boolean;
  lastMessage?: Message;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | number; // For group chats (admin)
  admins?: (string | number)[]; // For group chats
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  loading: boolean;
  error: string | null;
}

export interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
}

export interface AppState {
  darkMode: boolean;
  notifications: boolean;
}

export interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export interface WhatsAppProfile {
  name?: string;
  connectionStatus?: string;
  ownerJid: string;
  profileName: string | null;
  profilePictureUrl: string;
  // For backward compatibility with existing code
  pushName?: string;
  phoneNumber?: string;
  jid?: string;
} 