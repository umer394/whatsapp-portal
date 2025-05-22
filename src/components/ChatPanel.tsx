import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { format } from 'date-fns';
import { 
  FaSearch, 
  FaSmile, 
  FaPaperclip, 
  FaMicrophone,
  FaDownload,
  FaCheckDouble,
  FaCheck,
  FaArrowRight,
  FaPlus,
  FaQrcode,
  FaWhatsapp,
  FaCheck as FaCheckIcon
} from 'react-icons/fa';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useTheme } from '../context/ThemeContext';
import { Message } from '../types';
import QRCodeModal from './QRCodeModal';

interface ChatPanelProps {
  onEscPress: () => void;
}
// WhatsApp gradient for reuse
const whatsappGradient = 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)';

const ChatPanel: React.FC<ChatPanelProps> = ({ onEscPress }) => {
  const { user, whatsappConnected, whatsappProfile, whatsappLoading, checkWhatsAppStatus } = useAuth();
  const { activeChat, sendMessage } = useChat();
  const { darkMode } = useTheme();
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const statusCheckedRef = useRef(false);
  const [showQrModal, setShowQrModal] = useState(false);
  
  // Check WhatsApp connection status when component mounts
  useEffect(() => {
    if (!statusCheckedRef.current) {
      checkWhatsAppStatus();
      statusCheckedRef.current = true;
    }

    // Only check status periodically if WhatsApp is not connected
    // This prevents unnecessary API calls when already connected
    let statusCheckInterval: NodeJS.Timeout | null = null;
    
    if (!whatsappConnected) {
      statusCheckInterval = setInterval(() => {
        checkWhatsAppStatus().then(isConnected => {
          // If connected, clear the interval to stop checking
          if (isConnected && statusCheckInterval) {
            clearInterval(statusCheckInterval);
          }
        });
      }, 60000); // Check every minute
    }

    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [checkWhatsAppStatus, whatsappConnected]);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [activeChat?.messages]);
  
  useEffect(() => {
    // Handle Escape key press
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscPress();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onEscPress]);
  
  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showEmojiPicker &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target as Node)
      ) {
        const emojiPickerElement = document.querySelector('.EmojiPickerReact');
        if (emojiPickerElement && !emojiPickerElement.contains(event.target as Node)) {
          setShowEmojiPicker(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);
  
    const handleOpenQrModal = () => {
    // Prevent opening QR modal if WhatsApp is already connected or if we're still loading
    if (whatsappConnected || whatsappLoading) {
      return;
    }
    
    // Add a small delay to prevent multiple clicks
    setTimeout(() => {
      setShowQrModal(true);
    }, 300);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = () => {
    if (message.trim() === '') return;
    
    sendMessage(message);
    setMessage('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage(prev => prev + emojiData.emoji);
  };
  
  const handleAttachmentClick = (type: 'image' | 'file' | 'audio') => {
    // Trigger file input click
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
    setShowAttachmentMenu(false);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    // In a real app, we would upload the file to a server
    // Here we'll just simulate sending an image message
    sendMessage(
      file.name, 
      file.type.startsWith('image/') ? 'image' : 'file',
      {
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size
      }
    );
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Format message timestamp
  const formatMessageTime = (timestamp: Date): string => {
    return format(new Date(timestamp), 'HH:mm');
  };
  
  // Group messages by date
  const groupMessagesByDate = (): { date: string; messages: Message[] }[] => {
    if (!activeChat) return [];
    
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';
    let currentMessages: Message[] = [];
    
    activeChat.messages.forEach(message => {
      const messageDate = new Date(message.timestamp);
      const dateString = format(messageDate, 'MMMM d, yyyy');
      
      if (dateString !== currentDate) {
        if (currentMessages.length > 0) {
          groups.push({ date: currentDate, messages: currentMessages });
        }
        currentDate = dateString;
        currentMessages = [message];
      } else {
        currentMessages.push(message);
      }
    });
    
    if (currentMessages.length > 0) {
      groups.push({ date: currentDate, messages: currentMessages });
    }
    
    return groups;
  };
  
  // Helper to render different message types
  const renderMessageContent = (message: Message) => {
    switch (message.type) {
      case 'image':
        return (
          <div className="mb-1 overflow-hidden rounded">
            <img 
              src={message.fileUrl || 'https://via.placeholder.com/300x200'} 
              alt="Image" 
              className="max-h-60 max-w-full cursor-pointer object-contain"
            />
            {message.content && <p className="mt-1">{message.content}</p>}
          </div>
        );
      case 'file':
        return (
          <div className="mb-1 flex items-center rounded bg-white/50 p-2 dark:bg-black/20">
            <div className="mr-3 rounded bg-gray-200 p-2 dark:bg-gray-700">
              <svg viewBox="0 0 16 16" width="24" height="24"><path fill="#8696a0" d="M14 6.5V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h7.5L14 6.5zM3 2v12h10V7h-4V2H3z"></path></svg>
            </div>
            <div className="flex-1">
              <p className="font-medium">{message.fileName || 'Document'}</p>
              <p className="text-xs text-gray-500">
                {message.fileSize 
                  ? `${Math.round(message.fileSize / 1024)} KB · ${message.fileName?.split('.').pop() || 'docx'}` 
                  : 'Unknown size'}
              </p>
            </div>
            <button className="ml-2 rounded-full p-2 hover:bg-gray-200 dark:hover:bg-gray-700">
              <FaDownload size={16} className="text-[#8696a0]" />
            </button>
          </div>
        );
      default:
        return <p className="whitespace-pre-wrap">{message.content}</p>;
    }
  };
  
  const handleOpenQRModal = () => {
    setShowQRModal(true);
  };

  const handleCloseQRModal = () => {
    setShowQRModal(false);
  };

  const handleWhatsAppConnected = () => {
    checkWhatsAppStatus();
  };
  
  if (!activeChat) {
    // No active chat selected
    return (
      <div className="relative flex h-full flex-col items-center justify-center bg-[#f0f2f5] dark:bg-gray-800">
        <div className="mx-auto max-w-md text-center">
          {whatsappConnected ? (
            <>
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-green-500 dark:bg-green-900/30">
                <FaWhatsapp size={48} />
              </div>
              <h1 className="mb-2 text-3xl font-light text-gray-600 dark:text-gray-300">
                WhatsApp Connected
              </h1>
              {/* <p className="text-gray-500 dark:text-gray-400">
                Connected as <strong>{whatsappProfile?.pushName || "User"}</strong><br />
                Phone: {whatsappProfile?.phoneNumber || "Unknown"}
              </p> */}
              <div className="mt-6 rounded-lg bg-green-100 p-4 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <p>Your WhatsApp is connected and ready to use!</p>
                <p className="mt-2 text-sm">Select a contact from the sidebar to start messaging.</p>
              </div>
            </>
          ) : (
            <>
                <h1 className="mb-2 text-3xl font-light text-gray-600 dark:text-gray-300">
                  Use WABI on your computer
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                  Connect with your phone to use WABI
                </p>
                <div className="mt-6 flex justify-center">
                  <button 
                    className="flex items-center justify-center rounded-md px-6 py-3 text-white hover:opacity-90"
                    style={{ background: whatsappGradient }}
                    onClick={handleOpenQrModal}
                  >
                    <FaQrcode className="mr-2" />
                    Connect with QR code
                  </button>
                </div>
              </>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative flex h-full flex-col bg-[#efeae2] dark:bg-gray-800">
      {/* Chat header */}
      <div className="flex h-16 items-center justify-between bg-[#f0f2f5] px-4 dark:bg-gray-900">
        <div className="flex items-center">
          <img 
            src={
              activeChat.isGroup 
                ? activeChat.avatar || 'https://via.placeholder.com/40' 
                : activeChat.participants.find(p => p.id !== user?.id)?.avatar || 'https://via.placeholder.com/40'
            } 
            alt="Profile" 
            className="mr-3 h-10 w-10 rounded-full object-cover"
          />
          
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {activeChat.isGroup 
                ? activeChat.name 
                : activeChat.participants.find(p => p.id !== user?.id)?.name || 'Unknown'
              }
            </h3>
            <p className="text-xs text-gray-500">
              {activeChat.isGroup 
                ? `${activeChat.participants.length} participants`
                : activeChat.participants.find(p => p.id !== user?.id)?.isOnline 
                  ? 'online'
                  : 'offline'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="text-[#54656f] hover:text-gray-800 dark:text-gray-300 dark:hover:text-white">
            <FaSearch size={18} />
          </button>
        </div>
      </div>
      
      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 bg-[#efeae2] bg-[url('https://web.whatsapp.com/img/bg-chat-tile-light_a4be8e55186ed803df01fe73e18ff173.png')] dark:bg-[#0b141a] dark:bg-[url('https://web.whatsapp.com/img/bg-chat-tile-dark_f1e8249ce8bd43aef5e6a4fbd3887225.png')]"
      >
        {groupMessagesByDate().map((group, groupIndex) => (
          <div key={groupIndex}>
            {/* Date separator */}
            <div className="my-4 flex justify-center">
              <div className="rounded-lg bg-white px-3 py-1 text-xs text-[#54656f] shadow-sm">
                {group.date}
              </div>
            </div>
            
            {/* Messages */}
            {group.messages.map((msg, msgIndex) => {
              const isUserMessage = msg.senderId === user?.id;
              
              // Check if this is a forwarded message
              const isForwarded = msg.content?.includes('Forwarded');
              
              return (
                <div 
                  key={msgIndex}
                  className="mb-2 flex justify-end"
                >
                  <div 
                    className="relative max-w-[75%] rounded-lg px-3 py-2 shadow-sm bg-[#d9fdd3] text-gray-800"
                  >
                    {isForwarded && (
                      <div className="mb-1 flex items-center text-xs text-gray-500">
                        <FaArrowRight className="mr-1" size={10} />
                        <span>Forwarded</span>
                      </div>
                    )}
                    
                    {!isUserMessage && activeChat.isGroup && (
                      <p className="mb-1 text-sm font-medium text-[#53bdeb]">
                        {activeChat.participants.find(p => p.id === msg.senderId)?.name || 'Unknown'}
                      </p>
                    )}
                    
                    {renderMessageContent(msg)}
                    
                    <div className="flex items-center justify-end space-x-1 text-right text-[11px] text-[#8696a0]">
                      <span>{formatMessageTime(new Date(msg.timestamp))}</span>
                      <span className="ml-1">
                        {msg.read ? (
                          <FaCheckDouble className="text-[#53bdeb]" />
                        ) : msg.delivered ? (
                          <FaCheckDouble className="text-[#8696a0]" />
                        ) : (
                          <FaCheck className="text-[#8696a0]" />
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        
        {/* Auto-scroll to bottom */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input */}
      <div className="bg-[#f0f2f5] px-4 py-3 dark:bg-gray-900">
        <div className="flex items-center">
          <button className="rounded-full bg-white p-3 mr-2 shadow-sm text-[#54656f] hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700">
            <FaPlus size={20} />
          </button>
          
          <div className="flex flex-1 items-center rounded-full bg-white px-4 py-2 shadow-sm dark:bg-gray-800">
            <button 
              ref={emojiButtonRef}
              className="text-[#54656f] hover:text-gray-600 transition-colors duration-150 dark:text-gray-400 dark:hover:text-gray-300 mr-3"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <FaSmile size={24} />
            </button>
            
            {showEmojiPicker && (
              <div className="absolute bottom-20 left-16 z-10">
                <EmojiPicker 
                  onEmojiClick={handleEmojiClick} 
                  theme={darkMode ? Theme.DARK : Theme.LIGHT}
                />
              </div>
            )}
            
            <div className="relative">
              <button 
                className="text-[#54656f] hover:text-gray-600 transition-colors duration-150 dark:text-gray-400 dark:hover:text-gray-300 mr-3"
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              >
                <FaPaperclip size={24} />
              </button>
              
              {showAttachmentMenu && (
                <div className="absolute bottom-full left-0 mb-2 rounded-lg bg-white shadow-lg dark:bg-gray-800">
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button 
                    className="flex w-full items-center px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleAttachmentClick('image')}
                  >
                    <svg viewBox="0 0 53 53" width="24" height="24"><path fill="#0063cb" d="M26.5 53C41.136 53 53 41.136 53 26.5S41.136 0 26.5 0 0 11.864 0 26.5 11.864 53 26.5 53z"></path><path fill="#fff" d="M27.8 33.7l-2.1-2.1L31.9 25c.4-.4.6-.8.9-1.3l-8.5-.1v-3h8.6c-.5-.3-.7-.8-1-1.2l-6.1-6.4 2.1-2.1 9.3 9.3c.3.3.3.8 0 1.1l-9.4 9.4zm-9.4.2l-8.2-8.2 8.2-8.2V11h3v7.4l-6.2 6.2 6.2 6.2v7.4h-3v-6.1z"></path></svg>
                    <span className="ml-3">Photo & Video</span>
                  </button>
                  <button 
                    className="flex w-full items-center px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleAttachmentClick('file')}
                  >
                    <svg viewBox="0 0 53 53" width="24" height="24"><path fill="#5157ae" d="M26.5 53C41.136 53 53 41.136 53 26.5S41.136 0 26.5 0 0 11.864 0 26.5 11.864 53 26.5 53z"></path><path fill="#fff" d="M34 17l-2 2-11 11c-1 1-1 3 0 4s3 1 4 0l13-13s2-2 2-5-3-5-5-5-5 2-5 2L17 26s-3 3-3 7 4 7 8 7 8-4 8-4l9-9" stroke="#fff" stroke-width="2"></path></svg>
                    <span className="ml-3">Document</span>
                  </button>
                </div>
              )}
            </div>
            
            <input
              type="text"
              placeholder="Type a message"
              className="flex-1 bg-transparent p-2 outline-none dark:text-white"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          
          <button className="rounded-full bg-white p-3 ml-2 shadow-sm text-[#54656f] hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700">
            <FaMicrophone size={20} />
          </button>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <QRCodeModal 
          onClose={handleCloseQRModal} 
          onConnect={handleWhatsAppConnected}
        />
      )}
    </div>
  );
};

export default ChatPanel; 