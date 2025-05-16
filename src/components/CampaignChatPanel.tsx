import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import { Contact } from '../types';
import { 
  FaSmile, 
  FaPaperclip, 
  FaMicrophone,
  FaEllipsisV,
  FaTimes,
  FaUserPlus
} from 'react-icons/fa';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

interface CampaignChatPanelProps {
  campaign: { id: string; name: string; contacts: Contact[] } | null;
  onEscPress: () => void;
  onContactDisplay: (name: string) => void;
}

const CampaignChatPanel: React.FC<CampaignChatPanelProps> = ({ campaign, onEscPress, onContactDisplay }) => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const [campaignMessages, setCampaignMessages] = useState<{
    id: string;
    text: string;
    senderId: string;
    senderName: string;
    timestamp: Date;
    status: 'sent' | 'delivered' | 'read';
  }[]>([]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [campaignMessages]);
  
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
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = () => {
    if (message.trim() === '' || !campaign) return;
    
    // Create a new message
    const newMessage = {
      id: Date.now().toString(),
      text: message,
      senderId: (user?.id || 'current-user').toString(),
      senderName: user?.name || 'You',
      timestamp: new Date(),
      status: 'sent' as const
    };
    
    // Add to messages
    setCampaignMessages([...campaignMessages, newMessage]);
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
  
  const handleAttachmentClick = () => {
    // Trigger file input click
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !campaign) return;
    
    const file = files[0];
    // Create a message with file attachment (simplified)
    const newMessage = {
      id: Date.now().toString(),
      text: `Attached file: ${file.name}`,
      senderId: (user?.id || 'current-user').toString(),
      senderName: user?.name || 'You',
      timestamp: new Date(),
      status: 'sent' as const
    };
    
    setCampaignMessages([...campaignMessages, newMessage]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Format time (e.g., 14:23)
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Get contact display name
  const getContactDisplayName = (contact: Contact): string => {
    const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
    return name || contact.emailValue || contact.phone1Value || 'Unknown';
  };

  return (
    <div className="flex h-full flex-col bg-[#f0f2f5] dark:bg-gray-800">
      {campaign ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between bg-white px-4 py-2 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00a884] text-white mr-3">
                {campaign.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{campaign.name}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{campaign.contacts.length} contacts</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                onClick={() => {
                  // Show contacts in this campaign
                  campaign.contacts.forEach(contact => {
                    onContactDisplay(getContactDisplayName(contact));
                  });
                }}
              >
                <FaUserPlus />
              </button>
              <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                <FaEllipsisV />
              </button>
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#efeae2] dark:bg-gray-800">
            {campaignMessages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                <p className="mb-2 text-lg font-semibold">No messages yet</p>
                <p className="text-center">Start the conversation by sending a message to all contacts in this campaign.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {campaignMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === (user?.id || 'current-user').toString() ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`rounded-lg px-3 py-2 max-w-[75%] ${
                        msg.senderId === (user?.id || 'current-user').toString()
                          ? 'bg-[#d9fdd3] dark:bg-green-800 text-gray-800 dark:text-white'
                          : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white'
                      }`}
                    >
                      <div className="mb-1 text-sm font-semibold text-[#00a884] dark:text-green-400">
                        {msg.senderName}
                      </div>
                      <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                      <div className="mt-1 text-right text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(new Date(msg.timestamp))}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          {/* Input area */}
          <div className="bg-white p-3 dark:bg-gray-900">
            <div className="flex items-center rounded-full bg-[#f0f2f5] dark:bg-gray-800 px-4 py-1">
              {/* Emoji button */}
              <button 
                ref={emojiButtonRef}
                className="mr-2 text-[#54656f] dark:text-gray-400"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <FaSmile className="h-5 w-5" />
              </button>
              
              {/* Attachment button */}
              <button 
                className="mr-2 text-[#54656f] dark:text-gray-400"
                onClick={handleAttachmentClick}
              >
                <FaPaperclip className="h-5 w-5" />
              </button>
              
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />
              
              {/* Text input */}
              <textarea
                placeholder="Type a message"
                className="w-full resize-none bg-transparent py-2 outline-none dark:text-white"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              
              {/* Voice message button (placeholder) */}
              <button className="ml-2 text-[#54656f] dark:text-gray-400">
                <FaMicrophone className="h-5 w-5" />
              </button>
            </div>
            
            {/* Emoji picker */}
            {showEmojiPicker && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  theme={darkMode ? Theme.DARK : Theme.LIGHT}
                  width={350}
                  height={400}
                />
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center text-gray-500 dark:text-gray-400">
          <div className="mb-6 h-24 w-24 flex items-center justify-center rounded-full bg-gray-200 text-gray-400 dark:bg-gray-700">
            <FaTimes size={36} />
          </div>
          <p className="mb-2 text-xl font-semibold">No campaign selected</p>
          <p className="text-center px-8">
            Select a campaign from the list to start messaging or create a new campaign.
          </p>
        </div>
      )}
    </div>
  );
};

export default CampaignChatPanel; 