import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';
import { 
  FaSearch, 
  FaCheck,
  FaCheckDouble,
  FaUserPlus,
} from 'react-icons/fa';
import { Chat, User, Contact, ContactsResponse } from '../types';
import NewChatModal from './NewChatModal';
import VerticalMenu from './VerticalMenu';

interface SidebarProps {
  onOpenSettings: () => void;
  onChatSelect: () => void;
  onCampaignSelect?: (campaign: { id: string; name: string; contacts: Contact[] }) => void;
  onTabChange?: (tab: string) => void;
  activeTab?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onOpenSettings, 
  onChatSelect, 
  onCampaignSelect, 
  onTabChange,
  activeTab: externalActiveTab
}) => {
  const { user, checkWhatsAppStatus } = useAuth();
  const { chats, activeChat, selectChat } = useChat();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [activeTab, setActiveTab] = useState(externalActiveTab || 'contacts');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [contactsPage, setContactsPage] = useState(1);
  const [hasMoreContacts, setHasMoreContacts] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [initialContactCount, setInitialContactCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelFileInputRef = useRef<HTMLInputElement>(null);
  const googleContactsRef = useRef<HTMLButtonElement>(null);
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
  const [campaignSearchQuery, setCampaignSearchQuery] = useState('');
  const [selectedCampaignContacts, setSelectedCampaignContacts] = useState<Contact[]>([]);
  const [campaignStep, setCampaignStep] = useState(1);
  const [campaignGroupName, setCampaignGroupName] = useState('');
  const [campaigns, setCampaigns] = useState<{ id: string; name: string; contacts: Contact[] }[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<string | null>(null);
  const [showCampaignDeleteConfirm, setShowCampaignDeleteConfirm] = useState<string | null>(null);
  const campaignClickTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check WhatsApp status when component mounts - only once
  useEffect(() => {
    const hasCheckedWhatsApp = sessionStorage.getItem('whatsapp_status_checked');
    if (!hasCheckedWhatsApp) {
      checkWhatsAppStatus();
      sessionStorage.setItem('whatsapp_status_checked', 'true');
    }
  }, [checkWhatsAppStatus]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Reset page number when search query changes
    if (activeTab === 'contacts') {
      setContactsPage(1);
    }
  };

  const handleChatSelect = (chatId: string) => {
    selectChat(chatId);
    onChatSelect();
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const filteredChats = chats.filter(chat => {
    // If it's a group chat, search in group name
    if (chat.isGroup && chat.name) {
      return chat.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    // For direct chats, search in contact name
    const otherParticipant = chat.participants.find(p => p.id !== user?.id);
    return otherParticipant?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getChatName = (chat: Chat): string => {
    if (chat.isGroup) return chat.name || 'Group';
    
    const otherParticipant = chat.participants.find(p => p.id !== user?.id);
    return otherParticipant?.name || 'Unknown';
  };

  const getChatAvatar = (chat: Chat): string => {
    if (chat.isGroup) return chat.avatar || 'https://via.placeholder.com/40';
    
    const otherParticipant = chat.participants.find(p => p.id !== user?.id);
    return otherParticipant?.avatar || 'https://via.placeholder.com/40';
  };

  const getLastMessagePreview = (chat: Chat): string => {
    if (!chat.lastMessage) return '';
    
    const { type, content } = chat.lastMessage;
    
    if (type === 'image') return '📷 Photo';
    if (type === 'audio') return '🎤 Voice message';
    if (type === 'file') return '📎 Document';
    
    // Truncate text messages if too long
    return content.length > 40 ? `${content.substring(0, 37)}...` : content;
  };

  const getMessageTime = (chat: Chat): string => {
    if (!chat.lastMessage) return '';
    
    const { timestamp } = chat.lastMessage;
    const messageDate = new Date(timestamp);
    const today = new Date();
    
    if (
      messageDate.getDate() === today.getDate() &&
      messageDate.getMonth() === today.getMonth() &&
      messageDate.getFullYear() === today.getFullYear()
    ) {
      // Today, show time
      return format(messageDate, 'HH:mm');
    } else if (
      messageDate.getDate() === today.getDate() - 1 &&
      messageDate.getMonth() === today.getMonth() &&
      messageDate.getFullYear() === today.getFullYear()
    ) {
      // Yesterday
      return 'Yesterday';
    } else {
      // Other dates
      return format(messageDate, 'dd/MM/yyyy');
    }
  };

  // Fetch contacts when the contacts tab is activated
  useEffect(() => {
    if (activeTab === 'contacts') {
      fetchContacts();
    }
  }, [activeTab, contactsPage]);

  // Add a separate effect for search query with debounce
  useEffect(() => {
    if (activeTab !== 'contacts') return;
    
    const handler = setTimeout(() => {
      if (contactsPage === 1) {
        fetchContacts();
      } else {
        // Reset to page 1 if searching
        setContactsPage(1);
      }
    }, 500); // 500ms debounce
    
    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, activeTab]);

  const fetchContacts = async () => {
    try {
      setContactsLoading(true);
      setContactsError(null);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(
        `https://v3-wabi.cloudious.net/api/Contacts/GetByPagination/?pageNumber=${contactsPage}&pageSize=20&searchTerm=${searchQuery}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data: ContactsResponse = await response.json();
      
      if (data.status === 'success') {
        // If it's the first page or a new search, replace contacts
        // Otherwise append to existing contacts for pagination
        if (contactsPage === 1) {
          setContacts(data.data.items);
          
          // Store initial contact count for comparison after upload
          if (initialContactCount === 0) {
            setInitialContactCount(data.data.pagination.totalCount);
          }
        } else {
          setContacts(prev => [...prev, ...data.data.items]);
        }
        setHasMoreContacts(data.data.pagination.hasNext);
      } else {
        throw new Error(data.message || 'Failed to fetch contacts');
      }
    } catch (error) {
      setContactsError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setContactsLoading(false);
    }
  };

  const handleLoadMoreContacts = () => {
    setContactsPage(prev => prev + 1);
  };

  const getContactDisplayName = (contact: Contact): string => {
    if (contact.firstName || contact.lastName) {
      return `${contact.firstName} ${contact.lastName}`.trim();
    }
    if (contact.organizationName) {
      return contact.organizationName;
    }
    return contact.phone1Value || 'Unnamed Contact';
  };

  const handleImportContacts = () => {
    // Trigger the hidden file input click
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(fileExt || '')) {
      showToast('error', 'Please select a CSV or Excel file');
      return;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      showToast('error', 'File size exceeds 10MB limit');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(5); // Start progress animation
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Upload file
      fetch('https://v3-wabi.cloudious.net/api/Contacts/BulkUpload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      // Simulate progress
      let progress = 3;
      const progressInterval = setInterval(() => {
        progress += 2;
        if (progress >= 90) {
          clearInterval(progressInterval);
          progress = 90;
        }
        setUploadProgress(progress);
      }, 500);

      // Start polling for new contacts
      startPollingForNewContacts();

    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);
      showToast('error', 'Error uploading contacts: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const startPollingForNewContacts = () => {
    let pollCount = 0;
    const maxPolls = 10; // 5 minutes (10 polls × 30 seconds)
    
    // Poll every 30 seconds
    const pollInterval = setInterval(async () => {
      pollCount++;
      
      try {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          clearInterval(pollInterval);
          setIsUploading(false);
          throw new Error('Authentication token not found');
        }

        const response = await fetch(
          `https://v3-wabi.cloudious.net/api/Contacts/GetByPagination/?pageNumber=1&pageSize=1&searchTerm=`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        const data: ContactsResponse = await response.json();
        
        if (data.status === 'success') {
          const newTotalCount = data.data.pagination.totalCount;
          
          // If we have new contacts
          if (newTotalCount > initialContactCount) {
            clearInterval(pollInterval);
            setIsUploading(false);
            setUploadProgress(100);
            
            // Reset page and fetch new contacts
            setContactsPage(1);
            
            // Show success message
            setTimeout(() => {
              setUploadProgress(0);
              fetchContacts();
              showToast('success', `${newTotalCount - initialContactCount} new contacts imported successfully!`);
            }, 1500);
            
            return;
          }
          
          // If we've reached the maximum number of polls
          if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            setIsUploading(false);
            setUploadProgress(0);
            
            // Show a message
            showToast('info', 'Upload is taking longer than expected. Your contacts will appear once processing is complete.');
          }
        }
      } catch (error) {
        console.error('Error polling for new contacts:', error);
      }
    }, 20000); // 30 seconds

    // Return cleanup function
    return () => clearInterval(pollInterval);
  };

  const filteredCampaignContacts = contacts.filter(c => getContactDisplayName(c).toLowerCase().includes(campaignSearchQuery.toLowerCase()) || (c.phone1Value && c.phone1Value.includes(campaignSearchQuery)));

  // Function to handle campaign selection
  const handleCampaignSelect = (campaignId: string) => {
    setActiveCampaign(campaignId);
    const selectedCampaign = campaigns.find(c => c.id === campaignId);
    if (selectedCampaign && onCampaignSelect) {
      console.log("Sending campaign to parent:", selectedCampaign); // Debug
      onCampaignSelect(selectedCampaign);
    }
    // Only call onChatSelect if we're not using onCampaignSelect to avoid conflicts
    if (!onCampaignSelect) {
      onChatSelect(); // Notify parent component that a chat/campaign was selected
    }
  };

  // Function to handle campaign double click for delete option
  const handleCampaignClick = (campaignId: string) => {
    if (campaignClickTimerRef.current) {
      // Double click detected
      clearTimeout(campaignClickTimerRef.current);
      campaignClickTimerRef.current = null;
      setShowCampaignDeleteConfirm(campaignId);
    } else {
      // First click, start timer
      campaignClickTimerRef.current = setTimeout(() => {
        // Single click action - select the campaign
        console.log("Campaign clicked, ID:", campaignId);
        setActiveCampaign(campaignId);
        
        // Find the full campaign object and pass it to parent
        const selectedCampaign = campaigns.find(c => c.id === campaignId);
        if (selectedCampaign && onCampaignSelect) {
          console.log("Passing campaign to Main:", selectedCampaign);
          onCampaignSelect(selectedCampaign);
        } else {
          console.log("Campaign not found or onCampaignSelect not provided");
        }
        
        campaignClickTimerRef.current = null;
      }, 300); // 300ms delay to detect double clicks
    }
  };

  // Function to handle campaign delete
  const handleDeleteCampaign = (campaignId: string) => {
    setCampaigns(campaigns.filter(c => c.id !== campaignId));
    if (activeCampaign === campaignId) {
      setActiveCampaign(null);
    }
    setShowCampaignDeleteConfirm(null);
  };

  // Function to handle campaign delete cancel
  const handleCancelDeleteCampaign = () => {
    setShowCampaignDeleteConfirm(null);
  };

  // Add Google Import functionality
  const handleGoogleImport = () => {
    // Show toast explaining this feature
    showToast('info', 'Starting Google Contacts import process...');
    
    // Open Google OAuth popup
    // This is a mock implementation since we would need a real Google OAuth integration
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    try {
      window.open(
        'https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/contacts.readonly&response_type=code&redirect_uri=https://your-app-url.com/google-auth-callback',
        'Google Contacts Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      // In a real implementation, we would listen for the OAuth callback
      // For now, we'll simulate success after a delay
      setTimeout(() => {
        // Adding mock contacts after "import" with proper Contact type
        const mockGoogleContacts: Contact[] = [
          { 
            id: Date.now(), 
            firstName: 'John', 
            lastName: 'Google', 
            middleName: '',
            organizationName: 'Google Inc',
            organizationTitle: 'Developer',
            emailValue: 'john.google@example.com',
            phone1Value: '+1234567890',
            phone2Value: '',
            phone3Value: '',
            labels: 'google-import',
            businessID: 1,
            userID: 1,
            isActive: true,
            metaAddedBy: 'google-import',
            metaUpdatedBy: 'google-import',
            addedOn: new Date().toISOString(),
            updatedOn: new Date().toISOString()
          },
          { 
            id: Date.now() + 1, 
            firstName: 'Jane', 
            lastName: 'Gmail', 
            middleName: '',
            organizationName: 'Gmail',
            organizationTitle: 'Designer',
            emailValue: 'jane.gmail@example.com',
            phone1Value: '+0987654321',
            phone2Value: '',
            phone3Value: '',
            labels: 'google-import',
            businessID: 1,
            userID: 1,
            isActive: true,
            metaAddedBy: 'google-import',
            metaUpdatedBy: 'google-import',
            addedOn: new Date().toISOString(),
            updatedOn: new Date().toISOString()
          }
        ];
        
        // Add new contacts to the list
        setContacts(prev => [...mockGoogleContacts, ...prev]);
        
        // Show success message
        showToast('success', '2 contacts imported from Google successfully!');
      }, 2000);
    } catch (error) {
      console.error('Error opening Google auth window:', error);
      showToast('error', 'Failed to connect to Google. Please try again.');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <>
            {/* Search bar */}
            <div className="bg-white px-3 py-2 dark:bg-gray-900">
              <div className="flex items-center rounded-lg bg-[#f0f2f5] px-3 py-1 dark:bg-gray-800">
                <div className="flex items-center w-full">
                  <button className="mr-2 text-[#54656f]">
                    <FaSearch className="h-4 w-4" />
                  </button>
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-full bg-transparent py-1 outline-none dark:text-white"
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                </div>
              </div>
            </div>
            
            {/* Chats list */}
            <div className="overflow-y-auto flex-1">
              {filteredChats.length === 0 ? (
                <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
                  <p>No chats found</p>
                </div>
              ) : (
                filteredChats.map(chat => (
                  <div 
                    key={chat.id}
                    className={`flex cursor-pointer items-center border-b border-gray-100 px-3 py-3 hover:bg-[#f0f2f5] dark:border-gray-800 dark:hover:bg-gray-800 ${
                      activeChat?.id === chat.id ? 'bg-[#f0f2f5] dark:bg-gray-800' : ''
                    }`}
                    onClick={() => handleChatSelect(chat.id)}
                  >
                    <div className="relative mr-3">
                      <img 
                        src={getChatAvatar(chat)} 
                        alt={getChatName(chat)} 
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      {chat.participants.find(p => p.id !== user?.id)?.isOnline && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#25D366]"></span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate mr-2">{getChatName(chat)}</h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {getMessageTime(chat)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate mr-2">
                          {chat.lastMessage && chat.lastMessage.senderId === user?.id && (
                            <span className="mr-1 inline-flex text-gray-500">
                              {chat.lastMessage.read ? (
                                <FaCheckDouble className="text-[#53bdeb]" />
                              ) : chat.lastMessage.delivered ? (
                                <FaCheckDouble />
                              ) : (
                                <FaCheck />
                              )}
                            </span>
                          )}
                          {getLastMessagePreview(chat)}
                        </p>
                        
                        {chat.unreadCount > 0 && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#25D366] text-xs text-white flex-shrink-0">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        );
      case 'contacts':
        return (
          <>
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
            />
            
            {/* Upload progress overlay */}
            {isUploading && (
              <div className="absolute inset-0 backdrop-blur-md bg-black bg-opacity-30 dark:bg-opacity-50 z-10 flex flex-col items-center justify-center">
                <div className="max-w-md w-full px-8 py-6 rounded-xl bg-white dark:bg-gray-800 shadow-lg">
                  <h3 className="text-xl font-medium text-gray-800 dark:text-white mb-4 text-center">
                    {uploadProgress < 100 ? 'Importing Contacts' : 'Import Complete'}
                  </h3>
                  
                  <div className="relative w-full h-6 bg-gray-200 dark:bg-gray-700 rounded-full mb-6 overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-[#00a884] rounded-full transition-all duration-500 ease-in-out"
                      style={{ width: `${uploadProgress}%` }}
                    >
                      {uploadProgress === 100 && (
                        <div className="h-full w-full bg-[#00a884] animate-pulse"></div>
                      )}
                    </div>
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {uploadProgress}%
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-center text-gray-700 dark:text-gray-300 text-lg font-medium mb-2">
                    {uploadProgress < 100 
                      ? 'Uploading and processing contacts...' 
                      : 'Upload complete!'}
                  </p>
                  
                  {uploadProgress < 100 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-2">
                      This may take a few minutes depending on the file size.
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-2">
                      Your contacts have been successfully imported.
                    </p>
                  )}
                  
                  {uploadProgress === 100 && (
                    <div className="flex justify-center mt-4">
                      <button 
                        onClick={() => setIsUploading(false)}
                        className="px-4 py-2 bg-[#00a884] text-white rounded-lg hover:bg-[#008f6f] transition-colors"
                      >
                        View Contacts
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Search bar - only show if contacts exist or while loading */}
            {(contacts.length > 0 || (contactsLoading && contacts.length === 0)) && (
              <div className="bg-white px-3 py-2 dark:bg-gray-900">
                <div className="flex items-center rounded-lg bg-[#f0f2f5] px-3 py-1 dark:bg-gray-800">
                  <div className="flex items-center w-full">
                    <button className="mr-2 text-[#54656f]">
                      <FaSearch className="h-4 w-4" />
                    </button>
                    <input
                      type="text"
                      placeholder="Search Contacts"
                      className="w-full bg-transparent py-1 outline-none dark:text-white"
                      value={searchQuery}
                      onChange={handleSearch}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Contacts list */}
            <div className="overflow-y-auto flex-1">
              {contactsLoading && contacts.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                </div>
              ) : contactsError ? (
                <div className="flex h-full flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-4 text-center">
                  <p className="mb-4">Error loading contacts: {contactsError}</p>
                  <button 
                    onClick={fetchContacts}
                    className="px-4 py-2 bg-[#00a884] text-white rounded-lg hover:bg-[#008f6f]"
                  >
                    Retry
                  </button>
                </div>
              ) : contacts.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                  <img 
                    src="/no-contacts.svg" 
                    alt="No contacts found" 
                    className="w-48 h-48 mb-6"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Contacts';
                    }}
                  />
                  <p className="mb-6 text-lg">No contacts found</p>
                  <button 
                    className="px-6 py-3 bg-[#00a884] text-white rounded-lg hover:bg-[#008f6f] flex items-center"
                    onClick={handleImportContacts}
                  >
                    <FaUserPlus className="mr-2" />
                    Import Contacts
                  </button>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {contacts.map(contact => (
                      <div 
                        key={contact.id}
                        className="flex cursor-pointer items-center px-3 py-3 hover:bg-[#f0f2f5] dark:hover:bg-gray-800"
                      >
                        <div className="mr-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#DFE5E7] text-[#54656f] dark:bg-gray-700 dark:text-gray-300">
                            {getContactDisplayName(contact).charAt(0).toUpperCase()}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {getContactDisplayName(contact)}
                            </h3>
                          </div>
                          
                          <div className="flex items-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {contact.phone1Value || contact.emailValue || 'No contact info'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {hasMoreContacts && (
                    <div className="p-4 flex justify-center">
                      <button 
                        onClick={handleLoadMoreContacts}
                        className="px-4 py-2 bg-[#f0f2f5] dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center"
                        disabled={contactsLoading}
                      >
                        {contactsLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 dark:border-white mr-2"></div>
                            Loading...
                          </>
                        ) : 'Load More'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        );
      case 'campaigns':
        return (
          <>
            {/* Search bar */}
            <div className="bg-white px-3 py-2 dark:bg-gray-900">
              <div className="flex items-center rounded-lg bg-[#f0f2f5] px-3 py-1 dark:bg-gray-800">
                <div className="flex items-center w-full">
                  <button className="mr-2 text-[#54656f]">
                    <FaSearch className="h-4 w-4" />
                  </button>
                  <input
                    type="text"
                    placeholder="Search Campaigns"
                    className="w-full bg-transparent py-1 outline-none dark:text-white"
                    value={campaignSearchQuery}
                    onChange={(e) => setCampaignSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Campaigns list */}
            <div className="overflow-y-auto flex-1">
              {campaigns.length === 0 ? (
                <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
                  <p>No campaigns created yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {campaigns
                    .filter(c => c.name.toLowerCase().includes(campaignSearchQuery.toLowerCase()))
                    .map(campaign => (
                      <div 
                        key={campaign.id}
                        className={`flex cursor-pointer items-center px-3 py-3 hover:bg-[#f0f2f5] dark:hover:bg-gray-800 ${
                          activeCampaign === campaign.id ? 'bg-[#f0f2f5] dark:bg-gray-800' : ''
                        }`}
                        onClick={() => handleCampaignClick(campaign.id)}
                      >
                        <div className="mr-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00a884] text-white dark:bg-[#00a884]">
                            {campaign.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {campaign.name}
                            </h3>
                          </div>
                          
                          <div className="flex items-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {campaign.contacts.length} contact(s)
                            </p>
                          </div>
                        </div>

                        {/* Delete Confirmation Popup */}
                        {showCampaignDeleteConfirm === campaign.id && (
                          <div className="absolute z-10 right-20 bg-white dark:bg-gray-800 shadow-md rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Delete this campaign?</p>
                            <div className="flex space-x-2">
                              <button 
                                className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCampaign(campaign.id);
                                }}
                              >
                                Delete
                              </button>
                              <button 
                                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelDeleteCampaign();
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </>
        );
      case 'analytics':
        return (
          <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400 overflow-y-auto">
            <p>Analytics feature coming soon</p>
          </div>
        );
      default:
        return null;
    }
  };

  // Helper function to get the current tab title
  const getTabTitle = (): string => {
    switch (activeTab) {
      case 'chat': return 'Chat';
      case 'contacts': return 'Contacts';
      case 'campaigns': return 'Campaigns';
      case 'analytics': return 'Analytics';
      default: return 'Chat';
    }
  };

  // Update the component for new activeTab from props
  useEffect(() => {
    if (externalActiveTab && externalActiveTab !== activeTab) {
      setActiveTab(externalActiveTab);
    }
  }, [externalActiveTab]);

  return (
    <div className="flex h-full">
      {/* Vertical Menu */}
      <VerticalMenu 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        onOpenSettings={onOpenSettings}
      />

      {/* Sidebar Content */}
      <div className="flex h-full flex-1 flex-col bg-white dark:bg-gray-900 overflow-hidden">
        {/* Header with tab title instead of search bar */}
        <div className="bg-white px-4 py-4 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex-shrink-0 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">{getTabTitle()}</h1>
          {activeTab === 'campaigns' && (
            <button
              className="ml-2 p-2 rounded-full bg-[#00a884] text-white hover:bg-[#008f6f] focus:outline-none focus:ring-2 focus:ring-[#00a884]"
              onClick={() => setShowCreateCampaignModal(true)}
              title="Create Campaign"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
          {activeTab === 'contacts' && (
            <div className="flex">
              <button
                ref={googleContactsRef}
                className="ml-2 p-2 rounded-full bg-[#00a884] text-white hover:bg-[#008f6f] focus:outline-none focus:ring-2 focus:ring-[#00a884]"
                title="Import Contacts with Google"
                onClick={handleGoogleImport}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                </svg>
              </button>
              <button
                className="ml-2 p-2 rounded-full bg-[#00a884] text-white hover:bg-[#008f6f] focus:outline-none focus:ring-2 focus:ring-[#00a884]"
                onClick={handleImportContacts}
                title="Import Contacts with Excel"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM9 18.5 6.5 16l-1 1L9 20.5l6-6-1-1L9 18.5zM13 9V3.5L18.5 9H13z"/>
                </svg>
              </button>
              <input
                type="file"
                ref={excelFileInputRef}
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
              />
            </div>
          )}
        </div>
        
        {/* Create Campaign Modal */}
        {showCreateCampaignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-0 overflow-hidden dark:bg-gray-800">
              {campaignStep === 1 ? (
                <>
                  {/* Header */}
                  <div className="px-6 pt-6 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">New Campaign</h2>
                    {/* Selected contacts chips */}
                    {selectedCampaignContacts.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedCampaignContacts.map(contact => (
                          <div key={contact.id} className="flex items-center bg-[#00a884] text-white rounded-full px-3 py-1 text-sm">
                            {getContactDisplayName(contact)}
                            <button
                              className="ml-2 text-white hover:text-red-400 focus:outline-none"
                              onClick={() => setSelectedCampaignContacts(selectedCampaignContacts.filter(c => c.id !== contact.id))}
                              title="Remove"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="relative mb-2">
                      <input
                        type="text"
                        placeholder="Search name or number"
                        className="w-full rounded-md bg-gray-100 text-gray-800 placeholder-gray-500 px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[#00a884] border border-transparent focus:border-[#00a884] dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                        value={campaignSearchQuery}
                        onChange={e => setCampaignSearchQuery(e.target.value)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4-4m0 0A7 7 0 104 4a7 7 0 0013 13z" />
                        </svg>
                      </span>
                    </div>
                  </div>
                  {/* Contacts List */}
                  <div className="max-h-96 overflow-y-auto bg-white px-2 py-2 dark:bg-gray-800">
                    {filteredCampaignContacts.length === 0 ? (
                      <div className="text-center text-gray-500 py-8 dark:text-gray-400">No contacts found</div>
                    ) : (
                      filteredCampaignContacts.map(contact => {
                        const isSelected = selectedCampaignContacts.some(c => c.id === contact.id);
                        return (
                          <div
                            key={contact.id}
                            className={`flex items-center px-4 py-3 hover:bg-gray-100 rounded-lg cursor-pointer dark:hover:bg-gray-700 ${isSelected ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedCampaignContacts(selectedCampaignContacts.filter(c => c.id !== contact.id));
                              } else {
                                setSelectedCampaignContacts([...selectedCampaignContacts, contact]);
                              }
                            }}
                          >
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold mr-3 dark:bg-gray-600 dark:text-white">
                              {getContactDisplayName(contact).charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-gray-900 font-medium truncate dark:text-white">{getContactDisplayName(contact)}</div>
                              <div className="text-xs text-gray-500 truncate dark:text-gray-400">{contact.phone1Value || contact.emailValue || 'No contact info'}</div>
                            </div>
                            <div className="ml-2">
                              {isSelected ? (
                                <span className="h-5 w-5 flex items-center justify-center rounded-full bg-[#00a884] text-white">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              ) : (
                                <span className="h-5 w-5 flex items-center justify-center rounded-full border border-gray-500"></span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  {/* Footer Buttons */}
                  <div className="flex justify-end gap-2 bg-white px-6 py-4 border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <button
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      onClick={() => { setShowCreateCampaignModal(false); setCampaignStep(1); setSelectedCampaignContacts([]); setCampaignGroupName(''); }}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 bg-[#00a884] text-white rounded hover:bg-[#008f6f]"
                      onClick={() => setCampaignStep(2)}
                      disabled={selectedCampaignContacts.length === 0}
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Group Details Step */}
                  <div className="px-6 pt-6 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">New Campaign</h2>
                    {/* Selected contacts chips */}
                    {selectedCampaignContacts.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedCampaignContacts.map(contact => (
                          <div key={contact.id} className="flex items-center bg-[#00a884] text-white rounded-full px-3 py-1 text-sm">
                            {getContactDisplayName(contact)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="px-6 py-4 bg-white dark:bg-gray-800">
                    {/* Campaign icon placeholder */}
                    <div className="mb-4 flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl cursor-pointer border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <span className="text-gray-500 dark:text-gray-400">Add campaign icon <span className="text-xs">(optional)</span></span>
                    </div>
                    {/* Campaign name input */}
                    <div className="mb-4">
                      <label className="block text-gray-600 mb-1 text-sm dark:text-gray-400">Provide a campaign name</label>
                      <input
                        type="text"
                        className="w-full rounded-md bg-gray-100 text-gray-800 placeholder-gray-500 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00a884] border border-transparent focus:border-[#00a884] dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                        placeholder="Campaign name"
                        value={campaignGroupName}
                        onChange={e => setCampaignGroupName(e.target.value)}
                      />
                    </div>
                  </div>
                  {/* Footer Buttons */}
                  <div className="flex justify-end gap-2 bg-white px-6 py-4 border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <button
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      onClick={() => { setShowCreateCampaignModal(false); setCampaignStep(1); setSelectedCampaignContacts([]); setCampaignGroupName(''); }}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 bg-[#00a884] text-white rounded hover:bg-[#008f6f]"
                      onClick={() => {
                        const newCampaign = { 
                          id: Date.now().toString(), // Generate a unique ID
                          name: campaignGroupName || 'Untitled Campaign', 
                          contacts: selectedCampaignContacts 
                        };
                        console.log("Creating new campaign:", newCampaign);
                        setCampaigns([...campaigns, newCampaign]);
                        setShowCreateCampaignModal(false);
                        setCampaignStep(1);
                        setSelectedCampaignContacts([]);
                        setCampaignGroupName('');
                        
                        // Automatically select the newly created campaign
                        setActiveCampaign(newCampaign.id);
                        
                        // Pass the campaign to parent component
                        if (onCampaignSelect) {
                          console.log("Passing new campaign to Main component:", newCampaign);
                          onCampaignSelect(newCampaign);
                        }
                      }}
                      disabled={selectedCampaignContacts.length === 0}
                    >
                      Create
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Tab content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {renderTabContent()}
        </div>
      </div>

      {/* New chat modal */}
      {showNewChatModal && (
        <NewChatModal onClose={() => setShowNewChatModal(false)} />
      )}
    </div>
  );
};

export default Sidebar; 