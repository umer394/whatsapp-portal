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
}

const Sidebar: React.FC<SidebarProps> = ({ onOpenSettings, onChatSelect }) => {
  const { user, checkWhatsAppStatus } = useAuth();
  const { chats, activeChat, selectChat } = useChat();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [activeTab, setActiveTab] = useState('contacts');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [contactsPage, setContactsPage] = useState(1);
  const [hasMoreContacts, setHasMoreContacts] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [initialContactCount, setInitialContactCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
  const [campaignSearchQuery, setCampaignSearchQuery] = useState('');
  const [selectedCampaignContacts, setSelectedCampaignContacts] = useState<Contact[]>([]);
  const [campaignStep, setCampaignStep] = useState(1);
  const [campaignGroupName, setCampaignGroupName] = useState('');
  const [campaigns, setCampaigns] = useState<{ name: string; contacts: Contact[] }[]>([]);

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
          <div className="flex flex-col h-full text-gray-500 dark:text-gray-400 overflow-y-auto">
            {campaigns.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p>No campaigns created yet.</p>
              </div>
            ) : (
              <ul className="p-4 space-y-4">
                {campaigns.map((c, idx) => (
                  <li key={idx} className="bg-[#2a3942] rounded-lg p-4">
                    <div className="text-white font-semibold text-lg mb-1">{c.name}</div>
                    <div className="text-gray-400 text-sm">{c.contacts.length} contact(s)</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {c.contacts.map(contact => (
                        <span key={contact.id} className="bg-[#075e54] text-white rounded-full px-3 py-1 text-xs">
                          {getContactDisplayName(contact)}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
        </div>
        
        {/* Create Campaign Modal (placeholder) */}
        {showCreateCampaignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-[#222e35] rounded-xl shadow-2xl w-full max-w-sm p-0 overflow-hidden">
              {campaignStep === 1 ? (
                <>
                  {/* Header */}
                  <div className="px-6 pt-6 pb-2 border-b border-[#2a3942]">
                    <h2 className="text-lg font-semibold text-white mb-2">New group</h2>
                    {/* Selected contacts chips */}
                    {selectedCampaignContacts.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedCampaignContacts.map(contact => (
                          <div key={contact.id} className="flex items-center bg-[#075e54] text-white rounded-full px-3 py-1 text-sm">
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
                        className="w-full rounded-md bg-[#2a3942] text-white placeholder-gray-400 px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[#00a884] border border-transparent focus:border-[#00a884]"
                        value={campaignSearchQuery}
                        onChange={e => setCampaignSearchQuery(e.target.value)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4-4m0 0A7 7 0 104 4a7 7 0 0013 13z" />
                        </svg>
                      </span>
                    </div>
                  </div>
                  {/* Contacts List */}
                  <div className="max-h-96 overflow-y-auto bg-[#222e35] px-2 py-2">
                    {filteredCampaignContacts.length === 0 ? (
                      <div className="text-center text-gray-400 py-8">No contacts found</div>
                    ) : (
                      filteredCampaignContacts.map(contact => {
                        const isSelected = selectedCampaignContacts.some(c => c.id === contact.id);
                        return (
                          <div
                            key={contact.id}
                            className={`flex items-center px-4 py-3 hover:bg-[#2a3942] rounded-lg cursor-pointer ${isSelected ? 'bg-[#2a3942]' : ''}`}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedCampaignContacts(selectedCampaignContacts.filter(c => c.id !== contact.id));
                              } else {
                                setSelectedCampaignContacts([...selectedCampaignContacts, contact]);
                              }
                            }}
                          >
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#374045] flex items-center justify-center text-white font-bold mr-3">
                              {getContactDisplayName(contact).charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-medium truncate">{getContactDisplayName(contact)}</div>
                              <div className="text-xs text-gray-400 truncate">{contact.phone1Value || contact.emailValue || 'No contact info'}</div>
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
                  <div className="flex justify-end gap-2 bg-[#222e35] px-6 py-4 border-t border-[#2a3942]">
                    <button
                      className="px-4 py-2 bg-gray-700 text-gray-200 rounded hover:bg-gray-600"
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
                  <div className="px-6 pt-6 pb-2 border-b border-[#2a3942]">
                    <h2 className="text-lg font-semibold text-white mb-2">New group</h2>
                    {/* Selected contacts chips */}
                    {selectedCampaignContacts.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedCampaignContacts.map(contact => (
                          <div key={contact.id} className="flex items-center bg-[#075e54] text-white rounded-full px-3 py-1 text-sm">
                            {getContactDisplayName(contact)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="px-6 py-4">
                    {/* Group icon placeholder */}
                    <div className="mb-4 flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-[#2a3942] flex items-center justify-center text-gray-400 text-xl cursor-pointer border border-[#374045]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <span className="text-gray-400">Add group icon <span className="text-xs">(optional)</span></span>
                    </div>
                    {/* Group name input */}
                    <div className="mb-4">
                      <label className="block text-gray-400 mb-1 text-sm">Provide a group name</label>
                      <input
                        type="text"
                        className="w-full rounded-md bg-[#2a3942] text-white placeholder-gray-400 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00a884] border border-transparent focus:border-[#00a884]"
                        placeholder="Group name (optional)"
                        value={campaignGroupName}
                        onChange={e => setCampaignGroupName(e.target.value)}
                      />
                    </div>
                    {/* Disappearing messages placeholder */}
                    <div className="mb-4">
                      <label className="block text-gray-400 mb-1 text-sm">Disappearing messages</label>
                      <select className="w-full rounded-md bg-[#2a3942] text-white px-4 py-2 border border-[#374045] focus:outline-none">
                        <option value="off">Off</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">All new messages in this chat will disappear after the selected duration.</p>
                    </div>
                  </div>
                  {/* Footer Buttons */}
                  <div className="flex justify-end gap-2 bg-[#222e35] px-6 py-4 border-t border-[#2a3942]">
                    <button
                      className="px-4 py-2 bg-gray-700 text-gray-200 rounded hover:bg-gray-600"
                      onClick={() => { setShowCreateCampaignModal(false); setCampaignStep(1); setSelectedCampaignContacts([]); setCampaignGroupName(''); }}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 bg-[#00a884] text-white rounded hover:bg-[#008f6f]"
                      onClick={() => {
                        setCampaigns([...campaigns, { name: campaignGroupName || 'Untitled Campaign', contacts: selectedCampaignContacts }]);
                        setShowCreateCampaignModal(false);
                        setCampaignStep(1);
                        setSelectedCampaignContacts([]);
                        setCampaignGroupName('');
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