import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import Sidebar from '../components/Sidebar';
import ChatPanel from '../components/ChatPanel';
import CampaignChatPanel from '../components/CampaignChatPanel';
import InvoicesPanel from '../components/InvoicesPanel';
import QRCodeModal from '../components/QRCodeModal';
import MobileHeader from '../components/MobileHeader';
import MobileNavBar from '../components/MobileNavBar';
import FloatingActionButton from '../components/FloatingActionButton';
import { FaWhatsapp, FaQrcode } from 'react-icons/fa';
import { Contact } from '../types';
import Settings from '../components/Settings';
import SidebarSettingsContent from '../components/SidebarSettingsContent';

// WhatsApp gradient for reuse
const whatsappGradient = 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)';

const Main: React.FC = () => {
  const { darkMode } = useTheme();
  const { checkWhatsAppStatus, whatsappConnected, whatsappProfile, whatsappLoading } = useAuth();
  const [showQrConnect, setShowQrConnect] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);
  const hasCheckedStatus = useRef(false);
  const [activeCampaign, setActiveCampaign] = useState<{ id: string; name: string; contacts: Contact[] } | null>(null);
  const [activeTab, setActiveTab] = useState<string>('campaigns');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Check WhatsApp connection status when component mounts, but only once
  useEffect(() => {
    if (!hasCheckedStatus.current) {
      checkWhatsAppStatus();
      hasCheckedStatus.current = true;
    }
  }, [checkWhatsAppStatus]);

  const handleQrConnectClose = () => {
    setShowQrConnect(false);
  };

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

  const handleCloseQrModal = () => {
    setShowQrModal(false);
    // Re-check WhatsApp status when QR modal is closed
    checkWhatsAppStatus();
  };

  const handleWhatsAppConnected = () => {
    // Update the connection status and UI
    checkWhatsAppStatus().then(() => {
      // If WhatsApp was successfully connected, hide the QR connect screen
      setShowQrConnect(false);
    });
  };

  // Handle chat selection
  const handleChatSelect = () => {
    setShowQrConnect(false);
    // Reset active campaign when a regular chat is selected
    setActiveCampaign(null);
  };

  // Handle campaign selection
  const handleCampaignSelect = (campaign: { id: string; name: string; contacts: Contact[] }) => {
    console.log("Campaign selected in Main:", campaign); // Debug log
    setActiveCampaign(campaign);
    setActiveTab('campaigns');
    setShowQrConnect(false);
  };

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab !== 'campaigns') {
      setActiveCampaign(null);
    }
  };

  // Show toast message
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle contact display
  const handleContactDisplay = (name: string) => {
    showToast(`Contact: ${name}`);
  };

  // Mobile handlers
  const handleMobileSearchClick = () => {
    setShowMobileSearch(!showMobileSearch);
  };

  const handleMobileMenuClick = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const handleNewChat = () => {
    // Implement new chat functionality
    console.log("New chat");
  };

  const handleNewCampaign = () => {
    // Implement new campaign functionality
    console.log("New campaign");
  };

  const handleNewContact = () => {
    // Implement new contact functionality
    console.log("New contact");
  };

  // Right chat panel rendering logic
  const renderChatPanel = () => {
    console.log("Rendering chat panel, activeTab:", activeTab, "activeCampaign:", activeCampaign);
    
    // Handle settings tab - show Settings component on mobile, placeholder on desktop
    if (activeTab === 'settings') {
      return (
        <>
          {/* Mobile: Show SidebarSettingsContent */}
          <div className="md:hidden flex h-full flex-col bg-white dark:bg-gray-900 overflow-hidden">
            <SidebarSettingsContent />
          </div>
          
          {/* Desktop: Show placeholder */}
          <div className="hidden md:flex h-full flex-col items-center justify-center bg-[#f0f2f5] dark:bg-gray-800">
            <div className="mx-auto max-w-md text-center">
              <h1 className="text-xl font-medium text-gray-600 dark:text-gray-300">
                Select a chat to start messaging
              </h1>
            </div>
          </div>
        </>
      );
    }
    
    if (showQrConnect) {
      return (
        <div className="flex h-full flex-col items-center justify-center bg-[#f0f2f5] dark:bg-gray-800">
          <div className="mx-auto max-w-md text-center">
            {whatsappLoading ? (
              <div className="flex flex-col items-center justify-center text-center">
                <div className="mb-3 h-12 w-12 animate-spin rounded-full border-4 border-t-4 border-gray-200 border-t-green-500"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Checking WhatsApp connection...</p>
              </div>
            ) : whatsappConnected ? (
              <>
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-green-500 dark:bg-green-900/30">
                  <FaWhatsapp size={48} />
                </div>
                <h1 className="mb-2 text-3xl font-light text-gray-600 dark:text-gray-300">
                  WhatsApp Connected
                </h1>
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
    
    // Check if we should show campaign chat
    if (activeTab === 'campaigns' && activeCampaign) {
      console.log("Should render campaign chat panel with:", activeCampaign);
      return (
        <CampaignChatPanel 
          campaign={activeCampaign} 
          onEscPress={() => setShowQrConnect(true)}
          onContactDisplay={handleContactDisplay}
        />
      );
    }
    
    // Check if we should show invoices panel
    if (activeTab === 'invoices') {
      return (
        <InvoicesPanel 
          onEscPress={() => setShowQrConnect(true)}
        />
      );
    }
    
    // Default to regular chat panel
    return <ChatPanel onEscPress={() => setShowQrConnect(true)} />;
  };

  return (
    <div className={`h-screen w-screen overflow-hidden ${darkMode ? 'dark' : ''}`}>
      {/* Mobile Header */}
      <MobileHeader 
        activeTab={activeTab} 
        onSearchClick={handleMobileSearchClick} 
        onMenuClick={handleMobileMenuClick} 
      />
      
      {/* Header strip - reduced to 25% of screen height - only on desktop */}
      <div className="h-[25vh] w-full bg-[#00a884] desktop-only"></div>
      
      {/* Main app container */}
      <div className="absolute inset-0 mx-auto flex h-screen max-w-[1600px] flex-col px-[18px] pb-[18px] pt-[19px] md:pt-[19px] mobile-padding">
        <div className="flex h-full rounded-sm shadow-md mt-16 mb-16 md:mt-0 md:mb-0">
          {/* Left sidebar - hidden on mobile, shown on desktop */}
          <div className="w-[420px] min-w-[320px] border-r border-[#e9edef] dark:border-gray-700 desktop-only">
            <Sidebar 
              onOpenSettings={() => setActiveTab('settings')} 
              onChatSelect={handleChatSelect} 
              onCampaignSelect={handleCampaignSelect}
              onTabChange={handleTabChange}
              activeTab={activeTab}
              iconHighlightColor={whatsappGradient}
            />
          </div>
          
          {/* Right chat panel - full width on mobile */}
          <div className="flex-1">
            {renderChatPanel()}
          </div>
        </div>
        
        {/* Mobile Navigation Bar */}
        <MobileNavBar activeTab={activeTab} onTabChange={handleTabChange} />
        
        {/* Floating Action Button */}
        <FloatingActionButton 
          onNewChat={handleNewChat}
          onNewCampaign={handleNewCampaign}
          onNewContact={handleNewContact}
        />
        
        {/* QR Code Modal */}
        {showQrModal && <QRCodeModal onClose={handleCloseQrModal} onConnect={handleWhatsAppConnected} />}

        {/* Toast message */}
        {toastMessage && (
          <div className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white px-4 py-2 rounded-md shadow-md animate-fade-in-up">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default Main; 