import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { format } from 'date-fns';
import { 
  FaSearch, 
  FaCheck,
  FaCheckDouble,
  FaUserPlus,
  FaMoon,
  FaSun,
  FaBell,
  FaEdit,
  FaSignOutAlt,
  FaCamera,
  FaWhatsapp,
  FaSpinner
} from 'react-icons/fa';
import { Chat, User, Contact, ContactsResponse } from '../types';
import NewChatModal from './NewChatModal';
import VerticalMenu from './VerticalMenu';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';
import { useNavigate } from 'react-router-dom';

// Register Handsontable modules
registerAllModules();

interface SidebarProps {
  onOpenSettings: () => void;
  onChatSelect: () => void;
  onCampaignSelect?: (campaign: { id: string; name: string; description?: string; contacts: Contact[] }) => void;
  onTabChange?: (tab: string) => void;
  activeTab?: string;
  iconHighlightColor?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onOpenSettings, 
  onChatSelect, 
  onCampaignSelect, 
  onTabChange,
  activeTab: externalActiveTab,
  iconHighlightColor
}) => {
  const contactsContainerRef = useRef<HTMLDivElement>(null);
  
  const { user, checkWhatsAppStatus, updateUser, logout, whatsappConnected, whatsappProfile, whatsappLoading } = useAuth();
  const { chats, activeChat, selectChat } = useChat();
  const { showToast } = useToast();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
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
  const [campaignContactsPage, setCampaignContactsPage] = useState(1);
  const [campaignPopupSearchQuery, setCampaignPopupSearchQuery] = useState('');
  const [campaignContacts, setCampaignContacts] = useState<Contact[]>([]);
  const [loadingCampaignContacts, setLoadingCampaignContacts] = useState(false);
  const [hasMoreCampaignContacts, setHasMoreCampaignContacts] = useState(false);
  const [selectedCampaignContacts, setSelectedCampaignContacts] = useState<Contact[]>([]);
  const campaignContactsRef = useRef<HTMLDivElement>(null);
  const [campaignStep, setCampaignStep] = useState(1);
  const [campaignGroupName, setCampaignGroupName] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [campaignNameError, setCampaignNameError] = useState(false);
  const [campaigns, setCampaigns] = useState<{ id: string; name: string; description?: string; contacts: Contact[]; iconUrl?: string }[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<string | null>(null);
  const [showCampaignDeleteConfirm, setShowCampaignDeleteConfirm] = useState<string | null>(null);
  const [campaignActiveTab, setCampaignActiveTab] = useState<'contacts' | 'excel'>('contacts');
  const [tableData, setTableData] = useState<Array<[string, string]>>([['', ''], ['', ''], ['', ''], ['', '']]);
  
  // Ensure we always have at least 4 rows in the table
  const ensureMinimumRows = useCallback((data: Array<[string, string]>) => {
    const result = [...data];
    while (result.length < 4) {
      result.push(['', '']);
    }
    return result;
  }, []);
  const [campaignIconUrl, setCampaignIconUrl] = useState<string | null>(null);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [editCampaignId, setEditCampaignId] = useState<string | null>(null);
  const campaignIconInputRef = useRef<HTMLInputElement>(null);
  const hotTableRef = useRef(null);
  const campaignClickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [loadingCampaignDetails, setLoadingCampaignDetails] = useState(false);
  // Add a ref for the campaign search input near other useRef declarations (around line 54)
  const campaignSearchInputRef = useRef<HTMLInputElement>(null);
  
  // Check WhatsApp status when component mounts - only once
  useEffect(() => {
    const hasCheckedWhatsApp = sessionStorage.getItem('whatsapp_status_checked');
    if (!hasCheckedWhatsApp) {
      checkWhatsAppStatus();
      sessionStorage.setItem('whatsapp_status_checked', 'true');
    }
  }, [checkWhatsAppStatus]);
  
  // Handle escape key for closing campaign modal and delete confirmation
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Close delete confirmation if it's open
        if (showCampaignDeleteConfirm) {
          handleCancelDeleteCampaign();
        }
        
        // Close campaign modal if it's open
        if (showCreateCampaignModal) {
          setShowCreateCampaignModal(false);
          setCampaignStep(1);
          setSelectedCampaignContacts([]);
          setCampaignGroupName('');
          setCampaignDescription('');
          setCampaignIconUrl(null);
          setEditCampaignId(null);
          setCampaignActiveTab('contacts');
          setCampaignNameError(false);
          // Reset campaign contacts state
          setCampaignContacts([]);
          setCampaignContactsPage(1);
          setHasMoreCampaignContacts(false);
        }
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [showCreateCampaignModal, showCampaignDeleteConfirm]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Search will be triggered when Enter key is pressed
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

  // Only fetch contacts when tab is activated, not on every search query change
  // Search will be triggered with Enter key instead
  useEffect(() => {
    if (activeTab === 'contacts') {
      fetchContacts();
    }
  }, [activeTab]);

  // Handle infinite scrolling with IntersectionObserver
  useEffect(() => {
    if (activeTab !== 'contacts' || !hasMoreContacts || contactsLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // If the last element is visible and we have more contacts to load
        if (entries[0].isIntersecting && hasMoreContacts && !contactsLoading) {
          setContactsPage(prev => prev + 1);
        }
      },
      { threshold: 0.5 }
    );

    // Find the loader element
    const loaderElement = document.getElementById('contacts-loader');
    if (loaderElement) {
      observer.observe(loaderElement);
    }

    return () => {
      if (loaderElement) {
        observer.unobserve(loaderElement);
      }
    };
  }, [activeTab, hasMoreContacts, contactsLoading]);

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
        `https://api-ibico.cloudious.net/api/Contacts/GetByPagination/?pageNumber=${contactsPage}&pageSize=50&searchTerm=${searchQuery}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data: ContactsResponse = await response.json();
      
      if (data.status === 'success') {
        // Process contacts to extract photo if available in the response
        const processedContacts = data.data.items.map(contact => {
          // Check if API includes photo field under any known property
          if (contact.hasOwnProperty('photo')) {
            return contact;
          } else if (contact.hasOwnProperty('profilePicture')) {
            return { ...contact, photo: (contact as any).profilePicture };
          } else if (contact.hasOwnProperty('avatar')) {
            return { ...contact, photo: (contact as any).avatar };
          } else if (contact.hasOwnProperty('image')) {
            return { ...contact, photo: (contact as any).image };
          } else if (contact.hasOwnProperty('profilePhoto')) {
            return { ...contact, photo: (contact as any).profilePhoto };
          } else if (contact.hasOwnProperty('photoURL')) {
            return { ...contact, photo: (contact as any).photoURL };
          } else if (contact.hasOwnProperty('picture')) {
            return { ...contact, photo: (contact as any).picture };
          }
          
          // Check for nested photo properties
          for (const key in contact) {
            if (typeof (contact as any)[key] === 'object' && (contact as any)[key] !== null) {
              const obj = (contact as any)[key];
              if (obj.hasOwnProperty('photo') || obj.hasOwnProperty('url') || 
                  obj.hasOwnProperty('profilePicture') || obj.hasOwnProperty('avatar')) {
                const photoUrl = obj.photo || obj.url || obj.profilePicture || obj.avatar;
                return { ...contact, photo: photoUrl };
              }
            }
          }
          
                          // For contacts without photos, try to fetch from WhatsApp API if they have a phone number
          if (contact.phone1Value) {
            // Don't wait for this promise to resolve - we'll update the UI when it does
            fetchProfilePicture(contact.phone1Value).then(pictureUrl => {
              if (pictureUrl) {
                // Update the contact in the state with the WhatsApp profile picture
                setContacts(prevContacts => 
                  prevContacts.map(c => 
                    c.id === contact.id ? { ...c, photo: pictureUrl } : c
                  )
                );
              }
            });
          }
          
          return contact;
        });
        
        // If it's the first page or a new search, replace contacts
        // Otherwise append to existing contacts for pagination
        if (contactsPage === 1) {
          setContacts(processedContacts);
          
          // Store initial contact count for comparison after upload
          if (initialContactCount === 0) {
            setInitialContactCount(data.data.pagination.totalCount);
          }
        } else {
          setContacts(prev => [...prev, ...processedContacts]);
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

  // Helper function to fetch profile picture from WhatsApp API
  const fetchProfilePicture = async (phoneNumber: string): Promise<string | null> => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      // Format phone number if needed
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      
      // Call WhatsApp API to get profile picture
      const response = await fetch(
        `https://api-ibico.cloudious.net/api/WhatsApp/GetProfilePicture?phoneNumber=${encodeURIComponent(formattedPhone)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const data = await response.json();
      
      if (data.status === 'success' && data.data && data.data.profilePictureUrl) {
        return data.data.profilePictureUrl;
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching profile picture:", error);
      return null;
    }
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
      fetch('https://api-ibico.cloudious.net/api/Contacts/BulkUpload', {
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
          `https://api-ibico.cloudious.net/api/Contacts/GetByPagination/?pageNumber=1&pageSize=1&searchTerm=`,
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

  // Function to fetch contacts for the campaign popup
  const fetchCampaignContacts = async (page = 1, append = false, searchTerm?: string) => {
    try {
      setLoadingCampaignContacts(true);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Use the provided searchTerm if available, otherwise use the state value
      const queryTerm = searchTerm !== undefined ? searchTerm : campaignPopupSearchQuery;

      const response = await fetch(
        `https://api-ibico.cloudious.net/api/Contacts/GetByPagination/?pageNumber=${page}&pageSize=50&searchTerm=${queryTerm}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data: ContactsResponse = await response.json();
      
      if (data.status === 'success') {
        // Process contacts to extract photo if available in the response
        const processedContacts = data.data.items.map(contact => {
          // Check if API includes photo field under any known property
          if (contact.hasOwnProperty('photo')) {
            return contact;
          } else if (contact.hasOwnProperty('profilePicture')) {
            return { ...contact, photo: (contact as any).profilePicture };
          } else if (contact.hasOwnProperty('avatar')) {
            return { ...contact, photo: (contact as any).avatar };
          } else if (contact.hasOwnProperty('image')) {
            return { ...contact, photo: (contact as any).image };
          } else if (contact.hasOwnProperty('profilePhoto')) {
            return { ...contact, photo: (contact as any).profilePhoto };
          } else if (contact.hasOwnProperty('photoURL')) {
            return { ...contact, photo: (contact as any).photoURL };
          } else if (contact.hasOwnProperty('picture')) {
            return { ...contact, photo: (contact as any).picture };
          }
          
          // Check for nested photo properties
          for (const key in contact) {
            if (typeof (contact as any)[key] === 'object' && (contact as any)[key] !== null) {
              const obj = (contact as any)[key];
              if (obj.hasOwnProperty('photo') || obj.hasOwnProperty('url') || 
                  obj.hasOwnProperty('profilePicture') || obj.hasOwnProperty('avatar')) {
                const photoUrl = obj.photo || obj.url || obj.profilePicture || obj.avatar;
                return { ...contact, photo: photoUrl };
              }
            }
          }
          
          // For contacts without photos, try to fetch from WhatsApp API if they have a phone number
          if (contact.phone1Value) {
            // Don't wait for this promise to resolve - we'll update the UI when it does
            fetchProfilePicture(contact.phone1Value).then(pictureUrl => {
              if (pictureUrl) {
                // Update the contact in the state with the WhatsApp profile picture
                setCampaignContacts(prevContacts => 
                  prevContacts.map(c => 
                    c.id === contact.id ? { ...c, photo: pictureUrl } : c
                  )
                );
              }
            });
          }
          
          return contact;
        });
        
        // Filter out contacts that are already selected
        const filteredContacts = processedContacts.filter(contact => 
          !selectedCampaignContacts.some(selected => 
            selected.id === contact.id || 
            (selected.phone1Value && contact.phone1Value && 
             selected.phone1Value === contact.phone1Value)
          )
        );
        
        // If it's the first page or not appending, replace contacts
        // Otherwise append to existing contacts for pagination
        const newCampaignContacts = page === 1 && !append 
          ? filteredContacts 
          : [...campaignContacts, ...filteredContacts];
        
        setCampaignContacts(newCampaignContacts);
        
        // Update pagination state
        setHasMoreCampaignContacts(data.data.pagination.hasNext);
        setCampaignContactsPage(page);
        
        return newCampaignContacts;
      } else {
        throw new Error(data.message || 'Failed to fetch contacts');
      }
    } catch (error) {
      console.error('Error fetching campaign contacts:', error);
      showToast('error', 'Failed to load contacts');
      return [];
    } finally {
      setLoadingCampaignContacts(false);
    }
  };

  // Filter contacts for the campaign popup based on search query
  const filteredCampaignContacts = campaignContacts.filter(c => 
    getContactDisplayName(c).toLowerCase().includes(campaignPopupSearchQuery.toLowerCase()) || 
    (c.phone1Value && c.phone1Value.includes(campaignPopupSearchQuery))
  );

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
  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      setSavingCampaign(true);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Send delete request to API
      const response = await fetch(`https://api-ibico.cloudious.net/api/Campaigns/Delete/${campaignId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete campaign');
      }
      
      // Update local state
      setCampaigns(campaigns.filter(c => c.id !== campaignId));
      if (activeCampaign === campaignId) {
        setActiveCampaign(null);
      }
      
      showToast('success', 'Campaign deleted successfully');
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Failed to delete campaign');
    } finally {
      setSavingCampaign(false);
      setShowCampaignDeleteConfirm(null);
    }
  };

  // Function to handle campaign delete cancel
  const handleCancelDeleteCampaign = () => {
    setShowCampaignDeleteConfirm(null);
  };

  // Add Google Import functionality
  // const handleGoogleImport = () => {
  //   // Show toast explaining this feature
  //   showToast('info', 'Starting Google Contacts import process...');
    
  //   // Open Google OAuth popup
  //   // This is a mock implementation since we would need a real Google OAuth integration
  //   const width = 500;
  //   const height = 600;
  //   const left = window.screen.width / 2 - width / 2;
  //   const top = window.screen.height / 2 - height / 2;
    
  //   try {
  //     window.open(
  //       'https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/contacts.readonly&response_type=code&redirect_uri=https://your-app-url.com/google-auth-callback',
  //       'Google Contacts Authorization',
  //       `width=${width},height=${height},left=${left},top=${top}`
  //     );
      
  //     // In a real implementation, we would listen for the OAuth callback
  //     // For now, we'll simulate success after a delay
  //     setTimeout(() => {
  //       // Adding mock contacts after "import" with proper Contact type
  //       const mockGoogleContacts: Contact[] = [
  //         { 
  //           id: Date.now(), 
  //           firstName: 'John', 
  //           lastName: 'Google', 
  //           middleName: '',
  //           organizationName: 'Google Inc',
  //           organizationTitle: 'Developer',
  //           emailValue: 'john.google@example.com',
  //           phone1Value: '+1234567890',
  //           phone2Value: '',
  //           phone3Value: '',
  //           labels: 'google-import',
  //           businessID: 1,
  //           userID: 1,
  //           isActive: true,
  //           metaAddedBy: 'google-import',
  //           metaUpdatedBy: 'google-import',
  //           addedOn: new Date().toISOString(),
  //           updatedOn: new Date().toISOString()
  //         },
  //         { 
  //           id: Date.now() + 1, 
  //           firstName: 'Jane', 
  //           lastName: 'Gmail', 
  //           middleName: '',
  //           organizationName: 'Gmail',
  //           organizationTitle: 'Designer',
  //           emailValue: 'jane.gmail@example.com',
  //           phone1Value: '+0987654321',
  //           phone2Value: '',
  //           phone3Value: '',
  //           labels: 'google-import',
  //           businessID: 1,
  //           userID: 1,
  //           isActive: true,
  //           metaAddedBy: 'google-import',
  //           metaUpdatedBy: 'google-import',
  //           addedOn: new Date().toISOString(),
  //           updatedOn: new Date().toISOString()
  //         }
  //       ];
        
  //       // Add new contacts to the list
  //       setContacts(prev => [...mockGoogleContacts, ...prev]);
        
  //       // Show success message
  //       showToast('success', '2 contacts imported from Google successfully!');
  //     }, 2000);
  //   } catch (error) {
  //     console.error('Error opening Google auth window:', error);
  //     showToast('error', 'Failed to connect to Google. Please try again.');
  //   }
  // };

  // Campaign icon upload functionality
  const handleIconClick = () => {
    if (campaignIconInputRef.current) {
      campaignIconInputRef.current.click();
    }
  };

  const handleIconFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please select an image file');
      return;
    }

    // Check file size (2MB limit)
    const twoMB = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > twoMB) {
      showToast('error', 'Image size must be less than 2MB');
      return;
    }

    try {
      setUploadingIcon(true);

      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Upload to the server
      const response = await fetch('https://upload.myskool.app', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.status === 'success' && data.myresp && data.myresp[0]?.path) {
        setCampaignIconUrl(data.myresp[0].path);
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error) {
      showToast('error', 'Error uploading image: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setUploadingIcon(false);
      
      // Clear input so the same file can be selected again if needed
      if (campaignIconInputRef.current) {
        campaignIconInputRef.current.value = '';
      }
    }
  };

  const resetCampaignIcon = () => {
    setCampaignIconUrl(null);
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
                      className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-in-out"
                      style={{ 
                        width: `${uploadProgress}%`,
                        background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)'
                      }}
                    >
                      {uploadProgress === 100 && (
                        <div className="h-full w-full animate-pulse" style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}></div>
                      )}
                    </div>
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                      <span className="text-xs font-medium text-black">
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

            {/* Search bar - always show */}
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
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        setContactsPage(1);
                        fetchContacts();
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Contacts list */}
            <div 
              ref={contactsContainerRef}
              className="overflow-y-auto flex-1"
            >
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
                          {contact.photo ? (
                            <div className="h-12 w-12 rounded-full overflow-hidden">
                              <img 
                                src={contact.photo == ''
                                  ? '/placeholder-avatar.png' // Use a placeholder for Google photos that won't load
                                  : contact.photo} 
                                alt={getContactDisplayName(contact)}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  // Image failed to load, replace with fallback avatar
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement!.innerHTML = `
                                    <div class="h-12 w-12 rounded-full bg-[#DFE5E7] text-[#54656f] flex items-center justify-center">
                                      ${getContactDisplayName(contact).charAt(0).toUpperCase()}
                                    </div>
                                  `;
                                }}
                                referrerPolicy="no-referrer"
                                crossOrigin="anonymous"
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-[#DFE5E7] text-[#54656f] flex items-center justify-center dark:bg-gray-700 dark:text-gray-300">
                              {getContactDisplayName(contact).charAt(0).toUpperCase()}
                            </div>
                          )}
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
                  
                  {/* Loader at the bottom for infinite scrolling */}
                  {hasMoreContacts && (
                    <div id="contacts-loader" className="p-4 flex justify-center">
                      {contactsLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700 dark:border-white mr-2"></div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Loading more contacts...</span>
                        </div>
                      ) : (
                        <div className="h-8">
                          {/* Invisible element for intersection observer */}
                        </div>
                      )}
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
              {campaigns.length === 0 && !campaignsLoading ? (
                <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
                  <p>No campaigns created yet.</p>
                </div>
              ) : campaignsLoading && campaigns.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {campaigns.map(campaign => (
                      <div 
                        key={campaign.id}
                        className={`flex cursor-pointer items-center px-3 py-3 hover:bg-[#f0f2f5] dark:hover:bg-gray-800 group ${
                          activeCampaign === campaign.id ? 'bg-[#f0f2f5] dark:bg-gray-800' : ''
                        }`}
                        onClick={() => handleCampaignClick(campaign.id)}
                      >
                        <div className="mr-3">
                          {campaign.iconUrl ? (
                            <div className="h-12 w-12 rounded-full overflow-hidden">
                              <img 
                                src={campaign.iconUrl} 
                                alt={campaign.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  // Fallback if image fails to load
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement!.innerHTML = `
                                    <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[#00a884] text-white dark:bg-[#00a884]">
                                      ${campaign.name.charAt(0).toUpperCase()}
                                    </div>
                                  `;
                                }}
                              />
                            </div>
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00a884] text-white dark:bg-[#00a884]">
                              {campaign.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {campaign.name}
                            </h3>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {campaign.description || `${campaign.contacts.length} contact(s)`}
                            </p>
                            
                            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="relative group/tooltip">
                                <button 
                                  className="p-1 text-gray-500 hover:text-[#00a884] dark:text-gray-400 dark:hover:text-[#00a884] transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Edit campaign - Load data from API
                                    setEditCampaignId(campaign.id);
                                    fetchCampaignDetails(campaign.id);
                                    setCampaignStep(2); // Go directly to name/icon step
                                    setShowCreateCampaignModal(true);
                                  }}
                                  aria-label="Edit campaign"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <div className="absolute top-1/2 right-full -translate-y-1/2 mr-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                  Edit
                                  <div className="absolute top-1/2 left-full -translate-y-1/2 -ml-1 border-4 border-transparent border-l-gray-800"></div>
                                </div>
                              </div>
                              <div className="relative group/tooltip">
                                <button 
                                  className="p-1 text-gray-500 hover:text-[#00a884] dark:text-gray-400 dark:hover:text-[#00a884] transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Add contacts to campaign
                                    const campaignId = campaign.id;
                                    setEditCampaignId(campaignId);
                                    setCampaignStep(1); // Go to contacts selection step
                                    setCampaignActiveTab('contacts'); // Set contacts tab as active
                                    setCampaignPopupSearchQuery(''); // Clear any previous search
                                    setShowCreateCampaignModal(true);
                                    fetchCampaignDetails(campaignId); // Fetch campaign details with members
                                  }}
                                  aria-label="Manage members"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                  </svg>
                                </button>
                                <div className="absolute top-1/2 right-full -translate-y-1/2 mr-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                  Manage members
                                  <div className="absolute top-1/2 left-full -translate-y-1/2 -ml-1 border-4 border-transparent border-l-gray-800"></div>
                                </div>
                              </div>
                              <div className="relative group/tooltip">
                                <button 
                                  className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-500 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowCampaignDeleteConfirm(campaign.id);
                                  }}
                                  aria-label="Delete campaign"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                                <div className="absolute top-1/2 right-full -translate-y-1/2 mr-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                  Delete
                                  <div className="absolute top-1/2 left-full -translate-y-1/2 -ml-1 border-4 border-transparent border-l-gray-800"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Delete Confirmation Popup */}
                        {showCampaignDeleteConfirm === campaign.id && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm" onClick={(e) => {
                            if (e.target === e.currentTarget) {
                              handleCancelDeleteCampaign();
                            }
                          }}>
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden w-full max-w-md mx-4">
                              {/* Red header */}
                              <div className="bg-red-500 text-white py-4 px-6">
                                <h3 className="text-xl font-semibold">Confirm Delete</h3>
                              </div>
                              
                              <div className="p-6">
                                {/* Warning icon */}
                                <div className="flex justify-center mb-4">
                                  <div className="rounded-full bg-red-100 p-3 w-16 h-16 flex items-center justify-center">
                                    <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                  </div>
                                </div>
                                
                                {/* Confirmation text */}
                                <h4 className="text-xl text-center text-gray-700 dark:text-gray-200 font-semibold mb-2">Are you sure?</h4>
                                <p className="text-center text-gray-600 dark:text-gray-300 mb-2">
                                  You want to delete the Campaign:
                                </p>
                                <p className="text-center text-gray-800 dark:text-gray-100 font-medium text-lg mb-4">
                                  "{campaign.name}"
                                </p>
                                <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6">
                                  This action cannot be undone.
                                </p>
                                
                                {/* Buttons */}
                                <div className="flex gap-3 mt-4">
                                  <button 
                                    className="flex-1 py-3 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCancelDeleteCampaign();
                                    }}
                                    disabled={savingCampaign}
                                  >
                                    Cancel
                                  </button>
                                  <button 
                                    className={`flex-1 py-3 text-white rounded-md font-medium transition-colors flex items-center justify-center ${
                                      savingCampaign ? 'bg-red-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteCampaign(campaign.id);
                                    }}
                                    disabled={savingCampaign}
                                  >
                                    {savingCampaign ? (
                                      <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                                        Deleting...
                                      </>
                                    ) : (
                                      <>
                                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  
                  {/* Loader for infinite scrolling */}
                  {hasMoreCampaigns && (
                    <div id="campaigns-loader" className="p-4 flex justify-center">
                      {campaignsLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700 dark:border-white mr-2"></div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Loading more campaigns...</span>
                        </div>
                      ) : (
                        <div className="h-8">
                          {/* Invisible element for intersection observer */}
                        </div>
                      )}
                    </div>
                  )}
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
      case 'settings':
        return (
          <div className="flex-1 overflow-y-auto">
            {/* Header */}
            {/* <div className="bg-white px-4 py-4 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Settings</h1>
            </div> */}
            
            {/* Settings Content */}
            <div className="p-4">
              <SettingsContent />
            </div>
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
      case 'settings': return 'Settings';
      default: return 'Chat';
    }
  };

  // Update the component for new activeTab from props
  useEffect(() => {
    if (externalActiveTab && externalActiveTab !== activeTab) {
      setActiveTab(externalActiveTab);
    }
  }, [externalActiveTab]);

  // Add a new function to save campaign data to the API (after handleCancelDeleteCampaign)
  const saveCampaign = async (campaignData: { 
    id?: string; 
    name: string; 
    description?: string;
    contacts: Contact[]; 
    iconUrl?: string 
  }) => {
    try {
      setSavingCampaign(true);
      setCampaignError(null);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Prepare data for API with the required format
      const apiData = {
        campaign: {
          id: campaignData.id ? Number(campaignData.id) : 0,
          name: campaignData.name,
          description: campaignData.description || '',
          picture: campaignData.iconUrl || ''
        },
        campaignMembers: campaignData.contacts.map(contact => ({
          name: getContactDisplayName(contact),
          number: contact.phone1Value || '',
          photo: contact.photo || null
        }))
      };

      // Send request to API
      const response = await fetch('https://api-ibico.cloudious.net/api/Campaigns/Save', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save campaign');
      }
      
      if (data.status === 'error') {
        throw new Error(data.message || 'Failed to save campaign');
      }
      
      // Return the saved campaign data from API response
      return {
        id: (data.data.campaign?.id || data.data.id || campaignData.id || Date.now()).toString(),
        name: data.data.campaign?.name || data.data.name || campaignData.name,
        description: data.data.campaign?.description || data.data.description || campaignData.description,
        contacts: campaignData.contacts, // Keep the original contacts
        iconUrl: data.data.campaign?.picture || data.data.iconUrl || campaignData.iconUrl
      };
      
    } catch (error) {
      setCampaignError(error instanceof Error ? error.message : 'An unknown error occurred');
      showToast('error', error instanceof Error ? error.message : 'Failed to save campaign');
      throw error;
    } finally {
      setSavingCampaign(false);
    }
  };

  // State variables for campaign pagination
  const [campaignsPage, setCampaignsPage] = useState(1);
  const [campaignsPageSize, setCampaignsPageSize] = useState(50);
  const [hasMoreCampaigns, setHasMoreCampaigns] = useState(false);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  // Add a function to fetch campaigns with pagination
  const fetchCampaigns = async (page = campaignsPage, append = false) => {
    try {
      setCampaignsLoading(true);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Use GetByPagination endpoint
      const response = await fetch(
        `https://api-ibico.cloudious.net/api/Campaigns/GetByPagination/?pageNumber=${page}&pageSize=${campaignsPageSize}&searchTerm=${campaignSearchQuery}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const data = await response.json();
      
      if (data.status === 'success') {
                const processedCampaigns = data.data.items.map((campaign: any) => {
          // Handle both old and new response formats
          const campaignData = campaign.campaign || campaign;
          const contactsData = campaign.campaignMembers || campaign.contacts || [];
          
          // Create a properly structured campaign object
          const processedCampaign = {
            id: campaignData.id.toString(),
            name: campaignData.name,
            description: campaignData.description || '',
            iconUrl: campaignData.picture || campaignData.iconUrl,
            contacts: contactsData.map((contact: any) => {
              return {
                id: contact.contactId || contact.id || Date.now() + Math.random(),
                firstName: (contact.name || '').split(' ')[0] || '',
                lastName: (contact.name || '').split(' ').slice(1).join(' ') || '',
                phone1Value: contact.number || contact.phone,
                photo: contact.photo || '',
                // Add other required Contact fields with default values
                middleName: '',
                organizationName: '',
                organizationTitle: '',
                emailValue: '',
                phone2Value: '',
                phone3Value: '',
                labels: '',
                businessID: 1,
                userID: 1,
                isActive: true,
                metaAddedBy: '',
                metaUpdatedBy: '',
                addedOn: new Date().toISOString(),
                updatedOn: new Date().toISOString()
              };
            })
          };
          
          return processedCampaign;
        });
        
        // If it's the first page or we're not appending, replace campaigns
        // Otherwise append to existing campaigns for pagination
        setCampaigns(append ? [...campaigns, ...processedCampaigns] : processedCampaigns);
        
        // Update pagination state
        setHasMoreCampaigns(data.data.pagination.hasNext);
        
        // Return the processed campaigns in case we need them elsewhere
        return processedCampaigns;
      } else {
        throw new Error(data.message || 'Failed to fetch campaigns');
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      showToast('error', 'Failed to load campaigns');
      return [];
    } finally {
      setCampaignsLoading(false);
    }
  };
  
  // Load more campaigns function
  const loadMoreCampaigns = () => {
    if (hasMoreCampaigns && !campaignsLoading) {
      const nextPage = campaignsPage + 1;
      setCampaignsPage(nextPage);
      fetchCampaigns(nextPage, true);
    }
  };
  
  // Function to fetch campaign details for editing
  const fetchCampaignDetails = async (campaignId: string) => {
    try {
      setLoadingCampaignDetails(true);
      // Reset campaign contacts to avoid showing old filtered results
      setCampaignContacts([]);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Fetch campaign details from the LoadSelectedData endpoint
      const response = await fetch(
        `https://api-ibico.cloudious.net/api/Campaigns/LoadSelectedData?id=${campaignId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // Set campaign details
        setCampaignGroupName(data.data.campaign.name);
        setCampaignDescription(data.data.campaign.description || '');
        setCampaignIconUrl(data.data.campaign.picture || null);
        
        // Process and set selected contacts
        if (data.data.campaignMembers && Array.isArray(data.data.campaignMembers)) {
          const selectedContacts = data.data.campaignMembers.map((member: any) => {
            return {
              id: member.contactId || member.id || Date.now() + Math.random(),
              firstName: (member.name || '').split(' ')[0] || '',
              lastName: (member.name || '').split(' ').slice(1).join(' ') || '',
              phone1Value: member.number || member.phone || '',
              photo: member.photo || '',
              // Add other required Contact fields with default values
              middleName: '',
              organizationName: '',
              organizationTitle: '',
              emailValue: '',
              phone2Value: '',
              phone3Value: '',
              labels: '',
              businessID: 1,
              userID: 1,
              isActive: true,
              metaAddedBy: '',
              metaUpdatedBy: '',
              addedOn: new Date().toISOString(),
              updatedOn: new Date().toISOString()
            };
          });
          
          setSelectedCampaignContacts(selectedContacts);
          
          // Reset pagination and fetch all contacts with blank search term
          setCampaignContactsPage(1);
          setCampaignPopupSearchQuery('');
          fetchCampaignContacts(1, false);
        }
      } else {
        throw new Error(data.message || 'Failed to fetch campaign details');
      }
    } catch (error) {
      console.error('Error fetching campaign details:', error);
      showToast('error', 'Failed to load campaign details');
    } finally {
      setLoadingCampaignDetails(false);
    }
  };

  // Add a useEffect to fetch campaigns when the campaigns tab is activated or search query changes
  useEffect(() => {
    if (activeTab === 'campaigns') {
      setCampaignsPage(1);
      fetchCampaigns(1, false);
    }
  }, [activeTab, campaignSearchQuery]);
  
  // Fix the useEffect hook that initializes the campaign contacts when modal is opened
  // Fix by removing references to setDisplayedCampaignContacts around line 1970
  useEffect(() => {
    if (showCreateCampaignModal && campaignActiveTab === 'contacts') {
      // Reset page and search query first
      setCampaignContactsPage(1);
      setCampaignPopupSearchQuery(''); 
      
      // Then fetch contacts with an explicit empty search term
      fetchCampaignContacts(1, false, '');
      
      // Focus on the search input for better UX
      setTimeout(() => {
        if (campaignSearchInputRef.current) {
          campaignSearchInputRef.current.focus();
        }
      }, 100);
    }
  }, [showCreateCampaignModal, campaignActiveTab]);
  
  // Only fetch contacts when modal is opened, not on every search query change
  // Search will be triggered with Enter key instead
  useEffect(() => {
    if (showCreateCampaignModal && campaignActiveTab === 'contacts') {
      setCampaignContactsPage(1);
      fetchCampaignContacts(1, false);
    }
  }, [showCreateCampaignModal, campaignActiveTab]);
  
  // Add an effect for campaign infinite scrolling
  useEffect(() => {
    if (activeTab !== 'campaigns' || !hasMoreCampaigns || campaignsLoading) return;

    const campaignsObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreCampaigns && !campaignsLoading) {
          loadMoreCampaigns();
        }
      },
      { threshold: 0.5 }
    );

    const campaignsLoaderElement = document.getElementById('campaigns-loader');
    if (campaignsLoaderElement) {
      campaignsObserver.observe(campaignsLoaderElement);
    }

    return () => {
      if (campaignsLoaderElement) {
        campaignsObserver.unobserve(campaignsLoaderElement);
      }
    };
  }, [activeTab, hasMoreCampaigns, campaignsLoading]);
  
  // Function to load more campaign contacts
  const loadMoreCampaignContacts = () => {
    if (hasMoreCampaignContacts && !loadingCampaignContacts) {
      const nextPage = campaignContactsPage + 1;
      fetchCampaignContacts(nextPage, true);
    }
  };

  // Add an effect for campaign contacts infinite scrolling
  useEffect(() => {
    if (!showCreateCampaignModal || campaignActiveTab !== 'contacts' || !hasMoreCampaignContacts || loadingCampaignContacts) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreCampaignContacts && !loadingCampaignContacts) {
          loadMoreCampaignContacts();
        }
      },
      { threshold: 0.5 }
    );

    const loaderElement = document.getElementById('campaign-contacts-loader');
    if (loaderElement) {
      observer.observe(loaderElement);
    }

    return () => {
      if (loaderElement) {
        observer.unobserve(loaderElement);
      }
    };
  }, [showCreateCampaignModal, campaignActiveTab, hasMoreCampaignContacts, loadingCampaignContacts]);

    // The auto-search functionality is now handled directly in the modal open effect above

  return (
    <div className="flex h-full">
      {/* Vertical Menu */}
      <VerticalMenu 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        onOpenSettings={onOpenSettings}
        iconHighlightColor={iconHighlightColor}
      />

      {/* Sidebar Content */}
      <div className="flex h-full flex-1 flex-col bg-white dark:bg-gray-900 overflow-hidden">
        {/* Header with tab title instead of search bar */}
        <div className="bg-white px-4 py-4 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex-shrink-0 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">{getTabTitle()}</h1>
          {activeTab === 'campaigns' && (
            <button
              className="ml-2 p-2 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-[#00a884] hover:opacity-90 transition-opacity"
              onClick={() => setShowCreateCampaignModal(true)}
              title="Create Campaign"
              style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
          {activeTab === 'contacts' && (
            <div className="flex">
              <div className="relative group/tooltip">
                 <button
                  className="ml-2 p-2 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-[#00a884] hover:opacity-90 transition-opacity"
                  onClick={() => handleImportContacts()}
                  title="Import Contacts"
                  style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
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
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm"
            // Removed onClick handler to prevent closing when clicking outside the modal
          >
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-0 overflow-hidden dark:bg-gray-800">
                                {campaignStep === 1 ? (
                <>
                  {/* Loading overlay */}
                  {loadingCampaignDetails && (
                    <div className="absolute inset-0 z-10 bg-white bg-opacity-80 dark:bg-gray-800 dark:bg-opacity-80 flex items-center justify-center">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a884]"></div>
                        <p className="mt-4 text-gray-700 dark:text-gray-300 font-medium">Loading campaign data...</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Header */}
                  <div className="px-6 pt-6 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{editCampaignId ? 'Edit Campaign' : 'New Campaign'}</h2>
                      
                      {/* Show number of selected members */}
                      {selectedCampaignContacts.length > 0 && (
                        <div className="flex items-center">
                          <div className="bg-[#00a884] text-white rounded-full px-4 py-1 text-sm font-medium">
                            {selectedCampaignContacts.length} member{selectedCampaignContacts.length !== 1 ? 's' : ''} selected
                          </div>
                          {/* <button
                            className="ml-2 text-sm text-gray-500 hover:text-red-500 focus:outline-none dark:text-gray-400"
                            onClick={() => setSelectedCampaignContacts([])}
                          >
                            Clear
                          </button> */}
                        </div>
                      )}
                    </div>
                    
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                      <button
                        className={`px-4 py-2 font-medium text-sm -mb-px ${
                          campaignActiveTab === 'contacts'
                            ? 'border-b-2 border-[#00a884] text-[#00a884]'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                        onClick={() => setCampaignActiveTab('contacts')}
                      >
                        Contacts
                      </button>
                      <button
                        className={`px-4 py-2 font-medium text-sm -mb-px ${
                          campaignActiveTab === 'excel'
                            ? 'border-b-2 border-[#00a884] text-[#00a884]'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                        onClick={() => setCampaignActiveTab('excel')}
                      >
                        Excel
                      </button>
                    </div>

                    {/* Search input - only for contacts tab */}
                    {campaignActiveTab === 'contacts' && (
                      <div className="relative mb-2">
                        <input
                          type="text"
                          placeholder="Search name or number"
                          className="w-full rounded-md bg-gray-100 text-gray-800 placeholder-gray-500 px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[#00a884] border border-transparent focus:border-[#00a884] dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                          value={campaignPopupSearchQuery}
                          onChange={e => setCampaignPopupSearchQuery(e.target.value)}
                          ref={campaignSearchInputRef}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              setCampaignContactsPage(1);
                              fetchCampaignContacts(1, false); // No search term passed, will use the current state value
                            }
                          }}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4-4m0 0A7 7 0 104 4a7 7 0 0013 13z" />
                          </svg>
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Tab Content */}
                  {campaignActiveTab === 'excel' ? (
                    <div className="px-6 py-6">
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Add contact information below or paste multiple entries at once
                        </p>
                        <div className="border border-gray-300 rounded dark:border-gray-700 overflow-hidden">
                          <HotTable
                            ref={hotTableRef}
                            data={tableData}
                            colHeaders={['Name', 'Number']}
                            afterGetColHeader={(col, TH) => {
                              if (col === 1) {
                                // Add tooltip to phone number column
                                TH.setAttribute('title', 'Enter numbers only. Use + sign only at the beginning if needed.');
                              }
                            }}
                            rowHeaders={true}
                            height={200}
                            licenseKey="non-commercial-and-evaluation"
                            stretchH="all"
                            contextMenu={true}
                            className="hot-table"
                            columns={[
                              {}, // Name column - no specific validation
                              {
                                // Phone number column with validation
                                type: 'text',
                                validator: function(value, callback) {
                                  // Allow empty values
                                  if (value === '' || value === null || value === undefined) {
                                    callback(true);
                                    return;
                                  }
                                  
                                  const phoneRegex = /^(\+?)[0-9]+$/;
                                  const isValid = phoneRegex.test(value);
                                  
                                  callback(isValid);
                                },
                                allowInvalid: false,
                                className: 'htPhoneCell'
                              }
                            ]}
                            beforeChange={(changes, source) => {
                              if (changes && changes.length > 0) {
                                // Type assertion to tell TypeScript this is an array
                                const changeArray = changes as [number, string | number, any, any][];
                                
                                for (const [row, prop, oldValue, newValue] of changeArray) {
                                  // For phone column (index 1), enforce phone format
                                  if (prop === 1 && typeof newValue === 'string' && newValue !== '') {
                                    // If not valid format, reject the change
                                    if (!/^(\+?)[0-9]*$/.test(newValue)) {
                                      // Safe access with type checking
                                      if (changeArray[0] && changeArray[0].length >= 4) {
                                        changeArray[0][3] = oldValue;
                                      }
                                      return false;
                                    }
                                    
                                    // If there's a + sign, make sure it's only at the beginning
                                    if (newValue.indexOf('+') > 0) {
                                      // Safe access with type checking
                                      if (changeArray[0] && changeArray[0].length >= 4) {
                                        changeArray[0][3] = oldValue;
                                      }
                                      return false;
                                    }
                                  }
                                }
                              }
                              
                              return true;
                            }}
                            afterChange={(changes) => {
                              if (changes) {
                                const updatedData = [...tableData];
                                changes.forEach(([row, prop, oldValue, newValue]) => {
                                  if (typeof row === 'number' && (prop === 0 || prop === 1)) {
                                    // Ensure the row exists in updatedData
                                    while (row >= updatedData.length) {
                                      updatedData.push(['', '']);
                                    }
                                    // Update the cell value
                                    updatedData[row][prop as 0 | 1] = newValue;
                                  }
                                });
                                setTableData(updatedData);
                              }
                            }}
                            beforeKeyDown={(event) => {
                              const hotInstance = (hotTableRef.current as any)?.hotInstance;
                              if (!hotInstance) return;
                              
                              const selectedCell = hotInstance.getSelected();
                              if (!selectedCell || selectedCell.length === 0) return;
                              
                              // Get current row and column
                              const [row, col] = selectedCell[0];
                              const isLastRow = row === tableData.length - 1;
                              const isLastColumn = col === 1; // Number column is index 1
                              
                              // Handle Enter key
                              if (event.key === 'Enter') {
                                if (isLastRow) {
                                  // Add new row and move to the first column of the new row
                                  setTableData([...tableData, ['', '']]);
                                  // Let the default behavior happen (moving to the next row)
                                }
                              }
                              
                              // Handle Tab key
                              if (event.key === 'Tab' && !event.shiftKey && isLastRow && isLastColumn) {
                                // Add a new row when tabbing from the last cell
                                setTableData([...tableData, ['', '']]);
                              }
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-medium">Tip:</span> Copy/paste multiple rows from spreadsheets
                        </p>
                        {/* <button 
                          className="text-xs text-[#00a884] hover:underline"
                          onClick={() => {
                            const filtered = tableData.filter(([name, phone]) => name || phone);
                            // Use ensureMinimumRows to make sure we always have at least 4 rows
                            setTableData(ensureMinimumRows(filtered));
                          }}
                        >
                          Clean empty rows
                        </button> */}
                      </div>
                    </div>
                  ) : (
                    <div 
                      ref={campaignContactsRef}
                      className="max-h-96 overflow-y-auto bg-white px-2 py-2 dark:bg-gray-800"
                    >
                      {loadingCampaignContacts && campaignContacts.length === 0 && selectedCampaignContacts.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a884]"></div>
                        </div>
                      ) : (
                        <>
                          {/* Show selected contacts at the top with heading */}
                          {selectedCampaignContacts.length > 0 && (
                            <div className="mb-4">
                              <div className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg mb-2 dark:bg-gray-700 dark:text-gray-300">
                                Selected Members ({selectedCampaignContacts.length})
                              </div>
                              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {selectedCampaignContacts.map(contact => (
                                  <div
                                    key={contact.id}
                                    className="flex items-center px-4 py-3 hover:bg-gray-100 rounded-lg cursor-pointer dark:hover:bg-gray-700 bg-gray-50 dark:bg-gray-750"
                                    onClick={() => {
                                      setSelectedCampaignContacts(selectedCampaignContacts.filter(c => c.id !== contact.id));
                                    }}
                                  >
                                    <div className="flex-shrink-0 mr-3">
                                      {contact.photo ? (
                                        <div className="h-10 w-10 rounded-full overflow-hidden">
                                          <img 
                                            src={contact.photo == ''
                                              ? '/placeholder-avatar.png' 
                                              : contact.photo} 
                                            alt={getContactDisplayName(contact)}
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                              e.currentTarget.style.display = 'none';
                                              e.currentTarget.parentElement!.innerHTML = `
                                                <div class="h-10 w-10 rounded-full bg-gray-300 text-gray-700 font-bold flex items-center justify-center dark:bg-gray-600 dark:text-white">
                                                  ${getContactDisplayName(contact).charAt(0).toUpperCase()}
                                                </div>
                                              `;
                                            }}
                                            referrerPolicy="no-referrer"
                                            crossOrigin="anonymous"
                                          />
                                        </div>
                                      ) : (
                                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold dark:bg-gray-600 dark:text-white">
                                          {getContactDisplayName(contact).charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-gray-900 font-medium truncate dark:text-white">{getContactDisplayName(contact)}</div>
                                      <div className="text-xs text-gray-500 truncate dark:text-gray-400">{contact.phone1Value || contact.emailValue || 'No contact info'}</div>
                                    </div>
                                    <div className="ml-2">
                                      <span className="h-5 w-5 flex items-center justify-center rounded-full bg-[#00a884] text-white">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Separator if we have both selected and unselected contacts */}
                          {selectedCampaignContacts.length > 0 && campaignContacts.length > 0 && (
                            <div className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg mb-2 dark:bg-gray-700 dark:text-gray-300">
                              Available Contacts
                            </div>
                          )}
                          
                                                        {/* Show available contacts */}
                              {campaignContacts.length === 0 ? (
                                <div className="text-center text-gray-500 py-8 dark:text-gray-400">
                                  {campaignSearchQuery ? 'No matching contacts found' : 'No contacts found'}
                                </div>
                              ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                  {campaignContacts.map(contact => {
                                    // Check if this contact is already in the selected list
                                    const isSelected = selectedCampaignContacts.some(
                                      selected => selected.id === contact.id || 
                                      (selected.phone1Value && contact.phone1Value && 
                                       selected.phone1Value === contact.phone1Value)
                                    );
                                    
                                    return (
                                      <div
                                        key={contact.id}
                                        className={`flex items-center px-4 py-3 hover:bg-gray-100 rounded-lg cursor-pointer dark:hover:bg-gray-700 ${
                                          isSelected ? 'bg-gray-50 dark:bg-gray-750' : ''
                                        }`}
                                        onClick={() => {
                                          if (isSelected) {
                                            // Remove from selected if already selected
                                            setSelectedCampaignContacts(
                                              selectedCampaignContacts.filter(c => 
                                                c.id !== contact.id && 
                                                (c.phone1Value !== contact.phone1Value || !c.phone1Value || !contact.phone1Value)
                                              )
                                            );
                                          } else {
                                            // Add to selected if not already selected
                                            setSelectedCampaignContacts([...selectedCampaignContacts, contact]);
                                          }
                                        }}
                                      >
                                        <div className="flex-shrink-0 mr-3">
                                          {contact.photo ? (
                                            <div className="h-10 w-10 rounded-full overflow-hidden">
                                              <img 
                                                src={contact.photo == ''
                                                  ? '/placeholder-avatar.png' 
                                                  : contact.photo} 
                                                alt={getContactDisplayName(contact)}
                                                className="h-full w-full object-cover"
                                                onError={(e) => {
                                                  e.currentTarget.style.display = 'none';
                                                  e.currentTarget.parentElement!.innerHTML = `
                                                    <div class="h-10 w-10 rounded-full bg-gray-300 text-gray-700 font-bold flex items-center justify-center dark:bg-gray-600 dark:text-white">
                                                      ${getContactDisplayName(contact).charAt(0).toUpperCase()}
                                                    </div>
                                                  `;
                                                }}
                                                referrerPolicy="no-referrer"
                                                crossOrigin="anonymous"
                                              />
                                            </div>
                                          ) : (
                                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold dark:bg-gray-600 dark:text-white">
                                              {getContactDisplayName(contact).charAt(0).toUpperCase()}
                                            </div>
                                          )}
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
                                  })}
                            </div>
                          )}
                          
                          {/* Loader for infinite scrolling */}
                          {hasMoreCampaignContacts && (
                            <div 
                              id="campaign-contacts-loader" 
                              className="py-4 flex justify-center"
                            >
                              {loadingCampaignContacts ? (
                                <div className="flex items-center">
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#00a884] mr-2"></div>
                                  <span className="text-sm text-gray-600 dark:text-gray-400">Loading more contacts...</span>
                                </div>
                              ) : (
                                <div className="h-4">
                                  {/* Invisible element for intersection observer */}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* Footer Buttons */}
                  <div className="flex justify-end gap-2 bg-white px-6 py-4 border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <button
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      onClick={() => { 
                        setShowCreateCampaignModal(false); 
                        setCampaignStep(1); 
                        setSelectedCampaignContacts([]); 
                        setCampaignGroupName('');
                        setCampaignDescription('');
                        setCampaignIconUrl(null);
                        setEditCampaignId(null);
                        setCampaignActiveTab('contacts');
                        setCampaignNameError(false);
                        // Reset campaign contacts state
                        setCampaignContacts([]);
                        setCampaignContactsPage(1);
                        setCampaignPopupSearchQuery('');
                        setHasMoreCampaignContacts(false);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 bg-[#00a884] text-white rounded hover:bg-[#008f6f]"
                      onClick={() => {
                        // If Excel tab is active, convert table data to contacts
                        if (campaignActiveTab === 'excel') {
                          // Filter out empty rows
                          const validRows = tableData.filter(([name, phone]) => name.trim() || phone.trim());
                          
                          // if (validRows.length === 0) {
                          //   return; // Don't proceed if no valid data
                          // }
                          
                          // Convert table rows to Contact objects
                          const tableContacts: Contact[] = validRows.map(([name, phone], index) => ({
                            id: Date.now() + index, // Generate unique IDs
                            firstName: name,
                            lastName: '',
                            middleName: '',
                            organizationName: '',
                            organizationTitle: '',
                            emailValue: '',
                            phone1Value: phone,
                            phone2Value: '',
                            phone3Value: '',
                            labels: 'excel-import',
                            businessID: 1,
                            userID: 1,
                            isActive: true,
                            metaAddedBy: 'excel-import',
                            metaUpdatedBy: 'excel-import',
                            addedOn: new Date().toISOString(),
                            updatedOn: new Date().toISOString()
                          }));
                          
                          // Add these contacts to the selectedCampaignContacts
                          setSelectedCampaignContacts([...selectedCampaignContacts, ...tableContacts]);
                        }
                        
                        // Advance to the next step
                        setCampaignStep(2);
                      }}
                      disabled={
                        campaignActiveTab === 'contacts' 
                          ? selectedCampaignContacts.length === 0 && !loadingCampaignDetails
                          : false // Allow Next button to be clicked even if Excel is empty
                      }
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Group Details Step */}
                  <div className="px-6 pt-6 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{editCampaignId ? 'Edit Campaign' : 'New Campaign'}</h2>
                    {/* Show number of selected members */}
                    {selectedCampaignContacts.length > 0 && (
                      <div className="mb-2">
                        <div className="bg-[#00a884] text-white rounded-full px-3 py-1 text-sm font-medium inline-block">
                          {selectedCampaignContacts.length} member{selectedCampaignContacts.length !== 1 ? 's' : ''} selected
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="px-6 py-4 bg-white dark:bg-gray-800">
                    {/* Campaign icon upload */}
                    <div className="mb-4 flex items-center gap-3">
                      <div 
                        className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl cursor-pointer border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 relative overflow-hidden"
                        onClick={handleIconClick}
                      >
                        {uploadingIcon ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          </div>
                        ) : campaignIconUrl ? (
                          <>
                            <img 
                              src={campaignIconUrl} 
                              alt="Campaign icon" 
                              className="h-full w-full object-cover"
                            />
                            <div 
                              className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                resetCampaignIcon();
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </div>
                          </>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          {campaignIconUrl ? 'Change icon' : 'Add campaign icon'} <span className="text-xs">(optional)</span>
                        </span>
                        {!campaignIconUrl && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">Images up to 2MB</p>
                        )}
                      </div>
                      <input 
                        ref={campaignIconInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleIconFileChange}
                      />
                    </div>
                    {/* Campaign name input */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-gray-600 text-sm dark:text-gray-400">
                          Provide a campaign name <span className="text-red-500">*</span>
                        </label>
                        {campaignNameError && (
                          <span className="text-xs text-red-500">Campaign name is required</span>
                        )}
                      </div>
                      <input
                        type="text"
                        className={`w-full rounded-md bg-gray-100 text-gray-800 placeholder-gray-500 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00a884] 
                          border ${campaignNameError ? 'border-red-500' : 'border-transparent'} 
                          focus:border-[#00a884] dark:bg-gray-700 dark:text-white dark:placeholder-gray-400`}
                        placeholder="Campaign name"
                        value={campaignGroupName}
                        onChange={e => {
                          setCampaignGroupName(e.target.value);
                          if (e.target.value.trim()) {
                            setCampaignNameError(false);
                          }
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !savingCampaign && campaignGroupName.trim()) {
                            e.preventDefault();
                            
                            // Simulate clicking the Create/Update button
                            const handleSaveCampaign = async () => {
                              // Validate campaign name
                              if (!campaignGroupName.trim()) {
                                setCampaignNameError(true);
                                return;
                              }
                              
                              // Prepare campaign data
                              const campaignData = {
                                id: editCampaignId || undefined,
                                name: campaignGroupName.trim(),
                                description: campaignDescription.trim(),
                                contacts: selectedCampaignContacts,
                                iconUrl: campaignIconUrl || undefined
                              };
                              
                              try {
                                // Save to API
                                const savedCampaign = await saveCampaign(campaignData);
                                
                                // Reset and close modal first for better UX
                                setShowCreateCampaignModal(false);
                                setCampaignStep(1);
                                setSelectedCampaignContacts([]);
                                setCampaignGroupName('');
                                setCampaignIconUrl(null);
                                setEditCampaignId(null);
                                setCampaignActiveTab('contacts');
                                setCampaignNameError(false);
                                
                                if (editCampaignId) {
                                  //showToast('success', 'Campaign updated successfully');
                                } else {
                                  //showToast('success', 'Campaign created successfully');
                                }
                                
                                // Reload all campaigns data
                                setCampaignsPage(1);
                                fetchCampaigns(1, false).then((reloadedCampaigns) => {
                                  // After reload, find the campaign with updated data including correct contact count
                                  setTimeout(() => {
                                    const campaignId = savedCampaign.id;
                                    setActiveCampaign(campaignId);
                                    
                                    // Find the campaign in the reloaded data to ensure we have the correct members count
                                    const updatedCampaign = reloadedCampaigns.find((c: {id: string}) => c.id === campaignId) || savedCampaign;
                                    
                                    // Pass the campaign to parent component to populate the chat panel
                                    if (onCampaignSelect) {
                                      onCampaignSelect(updatedCampaign);
                                    }
                                  }, 100); // Small delay to ensure campaigns are loaded
                                });
                              } catch (error) {
                                // Error is already handled in saveCampaign function
                                console.error('Failed to save campaign:', error);
                              }
                            };
                            
                            handleSaveCampaign();
                          }
                        }}
                        onBlur={() => {
                          if (!campaignGroupName.trim()) {
                            setCampaignNameError(true);
                          }
                        }}
                      />
                    </div>
                    
                    {/* Campaign description input */}
                    {/* <div className="mb-4">
                      <label className="block text-gray-600 text-sm dark:text-gray-400 mb-1">
                        Description (optional)
                      </label>
                      <textarea
                        className="w-full rounded-md bg-gray-100 text-gray-800 placeholder-gray-500 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00a884] 
                          border border-transparent focus:border-[#00a884] dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                        placeholder="Enter campaign description"
                        rows={2}
                        value={campaignDescription}
                        onChange={e => setCampaignDescription(e.target.value)}
                      />
                    </div> */}
                  </div>
                  {/* Footer Buttons */}
                  <div className="flex justify-end gap-2 bg-white px-6 py-4 border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <button
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      onClick={() => { 
                        setShowCreateCampaignModal(false); 
                        setCampaignStep(1); 
                        setSelectedCampaignContacts([]); 
                        setCampaignGroupName('');
                        setCampaignDescription('');
                        setCampaignIconUrl(null);
                        setEditCampaignId(null);
                        setCampaignActiveTab('contacts');
                        setCampaignNameError(false);
                        // Reset campaign contacts state
                        setCampaignContacts([]);
                        setCampaignContactsPage(1);
                        setCampaignPopupSearchQuery('');
                        setHasMoreCampaignContacts(false);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className={`px-4 py-2 bg-[#00a884] text-white rounded hover:bg-[#008f6f] flex items-center ${savingCampaign ? 'opacity-75 cursor-not-allowed' : ''}`}
                      onClick={async () => {
                        // Validate campaign name
                        if (!campaignGroupName.trim()) {
                          setCampaignNameError(true);
                          return;
                        }
                        
                        // Prepare campaign data
                        const campaignData = {
                          id: editCampaignId || undefined,
                          name: campaignGroupName.trim(),
                          description: campaignDescription.trim(),
                          contacts: selectedCampaignContacts,
                          iconUrl: campaignIconUrl || undefined
                        };
                        
                        try {
                          // Save to API
                          const savedCampaign = await saveCampaign(campaignData);
                          
                          // Reset and close modal first for better UX
                          setShowCreateCampaignModal(false);
                          setCampaignStep(1);
                          setSelectedCampaignContacts([]);
                          setCampaignGroupName('');
                          setCampaignIconUrl(null);
                          setEditCampaignId(null);
                          setCampaignActiveTab('contacts');
                          setCampaignNameError(false);
                          
                          if (editCampaignId) {
                            //showToast('success', 'Campaign updated successfully');
                          } else {
                            //showToast('success', 'Campaign created successfully');
                          }
                          
                          // Reload all campaigns data
                          setCampaignsPage(1);
                          fetchCampaigns(1, false).then((reloadedCampaigns) => {
                            // After reload, find the campaign with updated data including correct contact count
                            setTimeout(() => {
                              const campaignId = savedCampaign.id;
                              setActiveCampaign(campaignId);
                              
                              // Find the campaign in the reloaded data to ensure we have the correct members count
                              const updatedCampaign = reloadedCampaigns.find((c: {id: string}) => c.id === campaignId) || savedCampaign;
                              
                              // Pass the campaign to parent component to populate the chat panel
                              if (onCampaignSelect) {
                                onCampaignSelect(updatedCampaign);
                              }
                            }, 100); // Small delay to ensure campaigns are loaded
                          });
                        } catch (error) {
                          // Error is already handled in saveCampaign function
                          console.error('Failed to save campaign:', error);
                        }
                      }}
                      disabled={selectedCampaignContacts.length === 0 || savingCampaign}
                    >
                      {savingCampaign ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {editCampaignId ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        editCampaignId ? 'Update' : 'Create'
                      )}
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

// Add the SettingsContent component definition within the Sidebar component
const SettingsContent: React.FC = () => {
  const { user, updateUser, logout, whatsappConnected, whatsappProfile, whatsappLoading, checkWhatsAppStatus } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDisconnectingWhatsApp, setIsDisconnectingWhatsApp] = useState(false);
  
  // Function to disconnect WhatsApp
  const disconnectWhatsApp = async () => {
    if (!whatsappConnected || isDisconnectingWhatsApp) return;
    
    try {
      setIsDisconnectingWhatsApp(true);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Call the logout endpoint
      const response = await fetch('https://api-ibico.cloudious.net/api/WhatsApp/LogoutInstance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        showToast('success', 'WhatsApp disconnected successfully');
      } else {
        throw new Error(data.message || 'Failed to disconnect WhatsApp');
      }
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
      showToast('error', error instanceof Error ? error.message : 'Failed to disconnect WhatsApp');
    } finally {
      setIsDisconnectingWhatsApp(false);
      // Check WhatsApp status to refresh UI
      checkWhatsAppStatus();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Profile section - compact with logo fallback */}
      <div className="flex flex-col items-center justify-center py-6">
        <div className="w-20 h-20 rounded-full overflow-hidden mb-2">
          {whatsappConnected && whatsappProfile?.profilePictureUrl ? (
            <img 
              src={whatsappProfile.profilePictureUrl}
              alt="WhatsApp Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 122.88 122.31">
                <defs>
                  <linearGradient id="whatsapp-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#25D366" />
                    <stop offset="100%" stopColor="#128C7E" />
                  </linearGradient>
                </defs>
                <path fill="url(#whatsapp-gradient)" d="M27.75,0H95.13a27.83,27.83,0,0,1,27.75,27.75V94.57a27.83,27.83,0,0,1-27.75,27.74H27.75A27.83,27.83,0,0,1,0,94.57V27.75A27.83,27.83,0,0,1,27.75,0Z"/>
                <path fill="#fff" d="M61.44,25.39A35.76,35.76,0,0,0,31.18,80.18L27.74,94.86l14.67-3.44a35.77,35.77,0,1,0,19-66ZM41,95.47,35.1,96.85l.94,4,4.35-1a43.36,43.36,0,0,0,10.46,4l1-4A40,40,0,0,1,41,95.45l0,0ZM21.76,86.53l4,.93,1.37-5.91a39.6,39.6,0,0,1-4.43-10.82l-4,1a44.23,44.23,0,0,0,4.06,10.46l-1,4.35Zm9.68,11.15-8.52,2,2-8.52-4-.93-2,8.51a4.12,4.12,0,0,0,3.08,5,4,4,0,0,0,1.88,0l8.52-2-.94-4.06Zm24-76a40.56,40.56,0,0,1,12,0L68,17.63a44.25,44.25,0,0,0-13.2,0l.63,4.07ZM99.14,38.4l-3.53,2.12a39.89,39.89,0,0,1,4.57,11l4-1a43.75,43.75,0,0,0-5-12.18Zm-69.81-.91A40.29,40.29,0,0,1,37.78,29l-2.47-3.32A43.62,43.62,0,0,0,26,35l3.32,2.47ZM85.1,29a40.11,40.11,0,0,1,8.46,8.45L96.88,35a43.62,43.62,0,0,0-9.3-9.3L85.1,29Zm8.46,55.78a40.11,40.11,0,0,1-8.46,8.45l2.45,3.32a44,44,0,0,0,9.33-9.3l-3.32-2.47ZM67.42,100.6a39.89,39.89,0,0,1-12,0l-.62,4.09a44.18,44.18,0,0,0,13.19,0l-.62-4.09Zm36.76-28.88-4-1A40,40,0,0,1,95.6,81.8l3.53,2.12a43.72,43.72,0,0,0,5.05-12.2Zm-2.84-10.57a39.93,39.93,0,0,1-.45,6l4.07.62a44.18,44.18,0,0,0,0-13.19l-4.07.62a39.8,39.8,0,0,1,.45,6ZM84.2,98.85l-2.12-3.53a39.89,39.89,0,0,1-11,4.57l1,4a43.75,43.75,0,0,0,12.18-5ZM21.55,61.15a41.15,41.15,0,0,1,.44-6l-4.07-.62a44.18,44.18,0,0,0,0,13.19L22,67.13a41.28,41.28,0,0,1-.44-6Zm2.2-22.75A43.83,43.83,0,0,0,18.7,50.59l4,1a40.08,40.08,0,0,1,4.57-11.06L23.75,38.4ZM72,18.41l-1,4A40.08,40.08,0,0,1,82.08,27l2.13-3.53A44,44,0,0,0,72,18.41Zm-21.13,0,1,4A40.08,40.08,0,0,0,40.8,27l-2.12-3.53a44,44,0,0,1,12.2-5.05Z"/>
              </svg>
            </div>
          )}
        </div>
        {!whatsappConnected || !whatsappProfile?.profilePictureUrl ? (
          <span className="text-lg font-bold mb-1" style={{ fontFamily: "'Mabry Pro', sans-serif" }}>WABI</span>
        ) : null}
        <div className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200 shadow-sm">
          <svg className="w-3.5 h-3.5 mr-1.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.924 2.617a.997.997 0 00-.215-.322l-.004-.004A.997.997 0 0017 2h-4a1 1 0 100 2h1.586l-3.293 3.293a1 1 0 001.414 1.414L16 5.414V7a1 1 0 102 0V3a.997.997 0 00-.076-.383z" />
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
          <span className="font-medium text-sm">
            {whatsappConnected && whatsappProfile?.phoneNumber ? 
              whatsappProfile.phoneNumber : 
              user?.phone || "+923332404969"}
          </span>
        </div>
        
        {/* WhatsApp Connection Status and Disconnect Button */}
        {whatsappConnected && (
          <div className="mt-3">
            <button
              onClick={disconnectWhatsApp}
              disabled={isDisconnectingWhatsApp || whatsappLoading}
              className="flex items-center justify-center px-3 py-1.5 rounded-full text-white text-xs font-medium shadow-sm transition-all 
                bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 
                disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isDisconnectingWhatsApp ? (
                <>
                  <svg className="animate-spin h-3 w-3 mr-1 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Disconnecting...
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Disconnect
                </>
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* Green Tip section with info icon - more compact */}
      <div className="bg-green-50 mx-3 mb-4 rounded-lg p-3">
        <div className="flex">
          <div className="flex-shrink-0 mr-2">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border-2 border-green-500">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div>
            <p className="font-medium text-sm text-green-800">Tip</p>
            <p className="text-xs text-green-700">To avoid having your account banned, do not send more than 200-500 messages per day per instance.</p>
          </div>
        </div>
      </div>
      
      {/* Theme section - more compact */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <h3 className="px-3 pt-3 pb-1 font-medium text-gray-900 dark:text-white text-base">Theme</h3>
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-gray-700 dark:text-gray-300">Light Mode</span>
          </div>
          
          <div className="relative">
            <input 
              type="checkbox" 
              id="theme-toggle"
              className="sr-only"
              checked={darkMode}
              onChange={toggleDarkMode}
            />
            <label 
              htmlFor="theme-toggle"
              className={`block h-6 w-12 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${darkMode ? 'bg-gray-400' : 'bg-green-500'}`}
            >
              <span 
                className={`absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${darkMode ? 'translate-x-6' : ''}`}
              ></span>
            </label>
          </div>
        </div>
      </div>
      
      {/* Notifications section - more compact */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <h3 className="px-3 pt-3 pb-1 font-medium text-gray-900 dark:text-white text-base">Notifications</h3>
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            <span className="text-sm text-gray-700 dark:text-gray-300">Notification Sounds</span>
          </div>
          
          <div className="relative">
            <input 
              type="checkbox" 
              id="notifications-toggle"
              className="sr-only"
              checked={notifications}
              onChange={() => setNotifications(!notifications)}
            />
            <label 
              htmlFor="notifications-toggle"
              className={`block h-6 w-12 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${notifications ? 'bg-green-500' : 'bg-gray-400'}`}
            >
              <span 
                className={`absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${notifications ? 'translate-x-6' : ''}`}
              ></span>
            </label>
          </div>
        </div>
      </div>
      
      {/* Logout button - more compact */}
      <div className="mt-auto pt-3 px-3 pb-4">
        <button 
          onClick={() => {
            showToast('success', 'Logged out successfully');
            logout();
            navigate('/login');
          }}
          className="w-full bg-red-500 text-white py-2 rounded-md flex items-center justify-center font-medium hover:bg-red-600 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 