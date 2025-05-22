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
  FaUserPlus,
  FaPaperPlane
} from 'react-icons/fa';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

interface CampaignChatPanelProps {
  campaign: { id: string; name: string; description?: string; contacts: Contact[]; iconUrl?: string } | null;
  onEscPress: () => void;
  onContactDisplay: (name: string) => void;
}

// Interface for campaign message from API
interface CampaignMessage {
  message: string;
  media: string | null;
  totalMembers: number;
  pendingCount: number;
  sentCount: number;
  notOnWhatsAppCount: number;
  errorCount: number;
  responseCount: number;
  addedOn: string;
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
    media?: string | null;
    stats?: {
      totalMembers: number;
      pendingCount: number;
      sentCount: number;
      notOnWhatsAppCount: number;
      errorCount: number;
      responseCount: number;
    };
  }[]>([]);
  const [uploadedMedia, setUploadedMedia] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Load campaign messages when campaign changes
  useEffect(() => {
    if (campaign?.id) {
      loadCampaignMessages(campaign.id);
    } else {
      // Clear messages if no campaign is selected
      setCampaignMessages([]);
    }
  }, [campaign]);

  // Function to load campaign messages from API
  const loadCampaignMessages = async (campaignId: string) => {
    try {
      setIsLoadingMessages(true);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Call API to get campaign messages
      const response = await fetch(`https://api-ibico.cloudious.net/api/Chat/LoadCampaignMessages/${campaignId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.status === 'success' && Array.isArray(data.data.items)) {
        // Transform API data to match our component's expected format
        const messages = data.data.items.map((msg: CampaignMessage) => ({
          id: Date.now() + Math.random().toString(),
          text: msg.message,
          media: msg.media,
          senderId: user?.id?.toString() || 'current-user',
          senderName: user?.name || 'You',
          timestamp: new Date(msg.addedOn),
          status: 'sent' as const,
          stats: {
            totalMembers: msg.totalMembers,
            pendingCount: msg.pendingCount,
            sentCount: msg.sentCount,
            notOnWhatsAppCount: msg.notOnWhatsAppCount,
            errorCount: msg.errorCount,
            responseCount: msg.responseCount
          }
        }));
        
        setCampaignMessages(messages);
      } else {
        // If no messages or error, set empty array
        setCampaignMessages([]);
      }
    } catch (error) {
      console.error("Error loading campaign messages:", error);
      setCampaignMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

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
  
  const handleAttachmentClick = () => {
    // Trigger file input click
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !campaign) return;
    
    const file = files[0];
    
    // Validate file type (images only)
    if (!file.type.startsWith('image/')) {
      alert('Only image files are supported.');
      return;
    }
    
    // Validate file size (5MB limit)
    const fiveMB = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > fiveMB) {
      alert('Image size must be less than 5MB');
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload to the server using the same API as campaign picture upload
      const response = await fetch('https://upload.myskool.app', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.status === 'success' && data.myresp && data.myresp[0]?.path) {
        // Store the uploaded file URL for sending with message
        setUploadedMedia(data.myresp[0].path);
        
        // Create and store image preview URL
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert('Error uploading image. Please try again.');
      setUploadedMedia(null);
      setImagePreview(null);
    } finally {
      setIsUploading(false);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const clearUploadedMedia = () => {
    setUploadedMedia(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };
  
  const handleSendMessage = async () => {
    // Validate if message is not empty (message text is mandatory even with image)
    if (message.trim() === '' || !campaign) {
      if (message.trim() === '') {
        //alert('Please enter a message');
      }
      return;
    }
    
    try {
      setIsSending(true);
      setSendError(null);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Prepare API request body
      const requestBody = {
        message: message.trim(),
        media: uploadedMedia || null,
        campaignID: Number(campaign.id),
        messageID: 0
      };
      
      // Call API to start campaign message
      const response = await fetch('https://api-ibico.cloudious.net/api/Chat/StartCampaign', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // Reload messages after sending
        await loadCampaignMessages(campaign.id);
        
        // Clear message and uploaded media
        setMessage('');
        clearUploadedMedia();
      } else {
        throw new Error(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error("Error sending campaign message:", error);
      setSendError(error instanceof Error ? error.message : 'Failed to send message');
      alert('Error sending message. Please try again.');
    } finally {
      setIsSending(false);
    }
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

  // Format time (e.g., 14:23)
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Get contact display name
  const getContactDisplayName = (contact: Contact): string => {
    const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
    return name || contact.emailValue || contact.phone1Value || 'Unknown';
  };

  // Function to open lightbox
  const openLightbox = (mediaUrl: string) => {
    setLightboxMedia(mediaUrl);
    setIsLightboxOpen(true);
    
    // Prevent body scrolling when lightbox is open
    document.body.style.overflow = 'hidden';
  };
  
  // Function to close lightbox
  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setLightboxMedia(null);
    
    // Restore body scrolling
    document.body.style.overflow = 'auto';
  };

  return (
    <div className="flex h-full flex-col bg-[#f0f2f5] dark:bg-gray-800">
      {/* Lightbox */}
      {isLightboxOpen && lightboxMedia && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
          onClick={closeLightbox}
        >
          <div className="relative max-h-screen max-w-screen-lg p-4">
            <button 
              className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 text-white hover:text-gray-300 hover:bg-opacity-70 transition-all"
              onClick={closeLightbox}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img 
              src={lightboxMedia} 
              alt="Media Preview" 
              className="max-h-[90vh] max-w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {campaign ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between bg-white px-4 py-2 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center">
              {campaign.iconUrl ? (
                <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
                  <img 
                    src={campaign.iconUrl} 
                    alt={campaign.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      // Fallback if image fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `
                        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[#00a884] text-white">
                          ${campaign.name.charAt(0).toUpperCase()}
                        </div>
                      `;
                    }}
                  />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00a884] text-white mr-3">
                  {campaign.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{campaign.name}</h2>
                {campaign.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">{campaign.description}</p>
                )}
              </div>
            </div>
            {/* <div className="flex items-center gap-4">
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
            </div> */}
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#efeae2] dark:bg-gray-800">
            {isLoadingMessages ? (
              <div className="flex h-full flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a884]"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading messages...</p>
              </div>
            ) : campaignMessages.length === 0 ? (
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
                      className={`rounded-lg px-3 py-2 max-w-[55%] ${
                        msg.senderId === (user?.id || 'current-user').toString()
                          ? 'bg-[#d9fdd3] dark:bg-green-800 text-gray-800 dark:text-white'
                          : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white'
                      }`}
                    >
                      {/* <div className="mb-1 text-sm font-semibold text-[#00a884] dark:text-green-400">
                        {msg.senderName}
                      </div> */}
                      
                      {/* Media preview */}
                      {msg.media && (
                        <div className="mb-2 rounded-lg overflow-hidden">
                          <img 
                            src={msg.media} 
                            alt="Media" 
                            className="max-w-full rounded-lg shadow-sm object-contain max-h-60 cursor-pointer"
                            onClick={() => openLightbox(msg.media!)}
                            onError={(e) => {
                              // Handle image load error
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement!.innerHTML = `
                                <div class="bg-gray-200 dark:bg-gray-600 p-3 rounded-lg text-center text-gray-500 dark:text-gray-400">
                                  Media unavailable
                                </div>
                              `;
                            }}
                          />
                        </div>
                      )}
                      
                      <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                      
                      {/* Message stats */}
                      {/* {msg.stats && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-1">
                          <span className="bg-green-100 dark:bg-green-900 px-1.5 py-0.5 rounded text-green-800 dark:text-green-200">
                            Sent: {msg.stats.sentCount}/{msg.stats.totalMembers}
                          </span>
                          {msg.stats.pendingCount > 0 && (
                            <span className="bg-yellow-100 dark:bg-yellow-900 px-1.5 py-0.5 rounded text-yellow-800 dark:text-yellow-200">
                              Pending: {msg.stats.pendingCount}
                            </span>
                          )}
                          {msg.stats.errorCount > 0 && (
                            <span className="bg-red-100 dark:bg-red-900 px-1.5 py-0.5 rounded text-red-800 dark:text-red-200">
                              Failed: {msg.stats.errorCount}
                            </span>
                          )}
                        </div>
                      )} */}
                      
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
            {/* Image preview */}
            {imagePreview && (
              <div className="mb-2 relative">
                <div className="relative inline-block">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-h-32 rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                  <button 
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    onClick={clearUploadedMedia}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
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
              
              {/* Hidden file input - modified to accept only images */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
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
                disabled={isUploading || isSending}
              />
              
              {/* Send message button */}
              <button 
                className={`ml-2 ${isSending ? 'text-gray-400' : 'text-[#54656f] dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400'}`} 
                onClick={handleSendMessage}
                disabled={isUploading || isSending}
              >
                {isUploading ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : isSending ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <FaPaperPlane className="h-5 w-5" />
                )}
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