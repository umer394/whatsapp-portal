import React, { createContext, useState, useContext, useEffect } from 'react';
import { ChatState, Chat, Message } from '../types';
import mockChats from '../data/mockChats';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';

interface ChatContextType extends ChatState {
  selectChat: (chatId: string) => void;
  sendMessage: (content: string, type?: 'text' | 'image' | 'audio' | 'file', fileInfo?: { url: string, name: string, size: number }) => void;
  createChat: (participantIds: (string | number)[], isGroup: boolean, name?: string, avatar?: string) => Promise<Chat>;
  updateChat: (chatId: string, data: Partial<Chat>) => void;
  deleteChat: (chatId: string) => void;
  markChatAsRead: (chatId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [chatState, setChatState] = useState<ChatState>({
    chats: [],
    activeChat: null,
    loading: true,
    error: null,
  });

  // Initialize chats from mock data
  useEffect(() => {
    if (user) {
      // In a real app, we would fetch chats from an API
      const chats = [...mockChats];
      setChatState({
        chats,
        activeChat: null,
        loading: false,
        error: null,
      });
    } else {
      setChatState({
        chats: [],
        activeChat: null,
        loading: false,
        error: null,
      });
    }
  }, [user]);

  const selectChat = (chatId: string) => {
    const selectedChat = chatState.chats.find(chat => chat.id === chatId);
    if (selectedChat) {
      setChatState(prev => ({
        ...prev,
        activeChat: selectedChat,
      }));
      
      // Mark as read when selecting
      markChatAsRead(chatId);
    }
  };

  const sendMessage = (
    content: string,
    type: 'text' | 'image' | 'audio' | 'file' = 'text',
    fileInfo?: { url: string, name: string, size: number }
  ) => {
    if (!chatState.activeChat || !user) return;
    
    const newMessage: Message = {
      id: uuidv4(),
      content,
      senderId: user.id,
      chatId: chatState.activeChat.id,
      timestamp: new Date(),
      read: false,
      delivered: true,
      type,
      ...(fileInfo ? {
        fileUrl: fileInfo.url,
        fileName: fileInfo.name,
        fileSize: fileInfo.size,
      } : {}),
    };
    
    const updatedChats = chatState.chats.map(chat => {
      if (chat.id === chatState.activeChat?.id) {
        return {
          ...chat,
          messages: [...chat.messages, newMessage],
          lastMessage: newMessage,
          updatedAt: new Date(),
        };
      }
      return chat;
    });
    
    // In a real app, we would send the message via WebSocket or API
    
    setChatState(prev => {
      if (!prev.activeChat) return prev;
      
      return {
        ...prev,
        chats: updatedChats,
        activeChat: {
          ...prev.activeChat,
          messages: [...prev.activeChat.messages, newMessage],
          lastMessage: newMessage,
          updatedAt: new Date(),
        },
      };
    });
  };

  const createChat = async (
    participantIds: (string | number)[],
    isGroup: boolean,
    name?: string,
    avatar?: string
  ): Promise<Chat> => {
    if (!user) throw new Error('User not authenticated');
    
    // Ensure current user is included in participants
    if (!participantIds.includes(user.id)) {
      participantIds.push(user.id);
    }
    
    // In a real app, we would call an API to create the chat
    
    const newChat: Chat = {
      id: uuidv4(),
      participants: participantIds.map(id => {
        const participant = mockChats
          .flatMap(chat => chat.participants)
          .find(p => p.id === id);
        
        if (!participant) {
          throw new Error(`Participant with ID ${id} not found`);
        }
        
        return participant;
      }),
      messages: [],
      unreadCount: 0,
      isGroup,
      name: isGroup ? name : undefined,
      avatar: isGroup ? avatar : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user.id,
      admins: isGroup ? [user.id] : undefined,
    };
    
    setChatState(prev => ({
      ...prev,
      chats: [...prev.chats, newChat],
      activeChat: newChat,
    }));
    
    return newChat;
  };

  const updateChat = (chatId: string, data: Partial<Chat>) => {
    const updatedChats = chatState.chats.map(chat => {
      if (chat.id === chatId) {
        return { ...chat, ...data };
      }
      return chat;
    });
    
    setChatState(prev => ({
      ...prev,
      chats: updatedChats,
      activeChat: prev.activeChat?.id === chatId 
        ? { ...prev.activeChat, ...data }
        : prev.activeChat,
    }));
  };

  const deleteChat = (chatId: string) => {
    const updatedChats = chatState.chats.filter(chat => chat.id !== chatId);
    
    setChatState(prev => ({
      ...prev,
      chats: updatedChats,
      activeChat: prev.activeChat?.id === chatId ? null : prev.activeChat,
    }));
  };

  const markChatAsRead = (chatId: string) => {
    const updatedChats = chatState.chats.map(chat => {
      if (chat.id === chatId) {
        // Mark all messages as read
        const updatedMessages = chat.messages.map(message => ({
          ...message,
          read: true,
        }));
        
        return {
          ...chat,
          messages: updatedMessages,
          unreadCount: 0,
        };
      }
      return chat;
    });
    
    setChatState(prev => {
      if (!prev.activeChat || prev.activeChat.id !== chatId) {
        return {
          ...prev,
          chats: updatedChats,
        };
      }
      
      return {
        ...prev,
        chats: updatedChats,
        activeChat: {
          ...prev.activeChat,
          messages: prev.activeChat.messages.map(message => ({
            ...message,
            read: true,
          })),
          unreadCount: 0,
        },
      };
    });
  };

  return (
    <ChatContext.Provider
      value={{
        ...chatState,
        selectChat,
        sendMessage,
        createChat,
        updateChat,
        deleteChat,
        markChatAsRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}; 