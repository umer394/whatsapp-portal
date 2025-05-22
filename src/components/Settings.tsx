/**
 * DEPRECATED: This standalone Settings component has been replaced by the settings tab in Sidebar.tsx
 * The functionality has been moved to the SettingsContent component inside Sidebar.tsx
 * This file is kept for reference but is no longer used in the application.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { FaTimes, FaMoon, FaSun, FaBell, FaEdit, FaSignOutAlt, FaCamera, FaWhatsapp, FaSpinner } from 'react-icons/fa';
import { User } from '../types';
import QRCodeModal from './QRCodeModal';
import { useNavigate } from 'react-router-dom';

// Default placeholder image for WhatsApp profile
const PLACEHOLDER_PROFILE_IMAGE = "https://cdn.pixabay.com/photo/2018/11/13/21/43/avatar-3814049_1280.png";

interface SettingsProps {
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const { user, updateUser, logout, whatsappConnected, whatsappProfile, whatsappLoading, checkWhatsAppStatus } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const settingsRef = useRef<HTMLDivElement>(null);
  
  const [name, setName] = useState(user?.name || '');
  const [status, setStatus] = useState(user?.status || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleUpdateProfile = () => {
    if (!user) return;
    
    const userData: Partial<User> = {};
    
    if (name !== user.name) {
      userData.name = name;
    }
    
    if (status !== user.status) {
      userData.status = status;
    }
    
    if (Object.keys(userData).length > 0) {
      updateUser(userData);
    }
    
    setIsEditingName(false);
    setIsEditingStatus(false);
  };
  
  const handleChangePicture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (file) {
        // In a real app, we would upload the image to a server
        // Here we'll just create a data URL and update the user's avatar
        const reader = new FileReader();
        reader.onload = () => {
          updateUser({ avatar: reader.result as string });
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
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
  
  const handleLogout = () => {
    // Close the settings panel first
    onClose();
    
    // Show logout toast
    showToast('success', 'Logged out successfully');
    
    // Perform logout action
    logout();
    
    // Navigate to login page
    navigate('/login');
  };
  
  // Handle escape key to close settings
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);
  
  // Handle outside click to close settings
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    // Add the event listener after a small delay to prevent immediate closing
    // when the settings panel is first opened
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  return (
    <div className="fixed inset-0 z-20 bg-black bg-opacity-50">
      <div 
        ref={settingsRef}
        className="absolute left-0 top-0 z-30 h-full w-[400px] bg-white shadow-lg dark:bg-gray-900"
      >
        {/* Header */}
        {/* <div className="flex h-16 items-center justify-between bg-gray-100 px-4 dark:bg-gray-800">
          <h2 className="text-xl font-medium dark:text-white">Settings</h2>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <FaTimes size={20} />
          </button>
        </div> */}
        
        {/* Content */}
        <div className="h-[calc(100%-4rem)] overflow-y-auto">
          {/* Profile section */}
          <div className="border-b border-gray-200 p-4 dark:border-gray-700">
            <div className="mb-6 flex flex-col items-center">
              <div className="relative mb-4">
                {whatsappConnected && whatsappProfile ? (
                  <img 
                    src={whatsappProfile.profilePictureUrl || PLACEHOLDER_PROFILE_IMAGE}
                    alt="WhatsApp Profile"
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <img 
                    src={user?.avatar || PLACEHOLDER_PROFILE_IMAGE}
                    alt="Profile"
                    className="h-24 w-24 rounded-full object-cover"
                  />
                )}
              </div>
              
              {isEditingName && !whatsappConnected ? (
                <div className="mb-2 w-full">
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2 text-center dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="Your name"
                    autoFocus
                  />
                  <div className="mt-2 flex justify-center">
                    <button 
                      className="mr-2 rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      onClick={() => setIsEditingName(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="rounded bg-whatsapp-teal px-3 py-1 text-sm text-white hover:bg-whatsapp-dark-green"
                      onClick={handleUpdateProfile}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-2 flex items-center justify-center">
                  <h3 className="text-lg font-medium dark:text-white">
                    {whatsappConnected && whatsappProfile ? 
                      (whatsappProfile.profileName ? 
                        whatsappProfile.profileName : user?.name) 
                      : user?.name}
                  </h3>
                </div>
              )}
              
              {whatsappConnected ? (
                <button 
                  className="mt-2 rounded-md bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                  onClick={async () => {
                    try {
                      setIsLoggingOut(true);
                      // Get token from localStorage
                      const token = localStorage.getItem('token');
                      if (!token) {
                        setIsLoggingOut(false);
                        return;
                      }
                      
                      // Call the logout endpoint
                      const response = await fetch('https://v3-wabi.cloudious.net/api/WhatsApp/LogoutInstance', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        }
                      });
                      
                      // Check if the request was successful
                      if (response.ok) {
                        // After logout, check the instance status
                        await checkWhatsAppStatus();
                        showToast('success', 'WhatsApp disconnected successfully');
                      } else {
                        console.error('Failed to logout WhatsApp instance');
                        showToast('error', 'Failed to disconnect WhatsApp');
                      }
                    } catch (error) {
                      console.error('Error logging out WhatsApp:', error);
                      showToast('error', 'Error disconnecting WhatsApp');
                    } finally {
                      setIsLoggingOut(false);
                    }
                  }}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? (
                    <>
                      <FaSpinner className="mr-2 animate-spin" size={14} />
                      Logging out...
                    </>
                  ) : (
                    'Logout WhatsApp'
                  )}
                </button>
              ) : null}
            </div>
            
            {/* WhatsApp Profile Information */}
            {whatsappConnected && whatsappProfile && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FaWhatsapp className="mr-3 text-green-500" size={20} />
                    <span className="font-medium text-green-800 dark:text-green-300">WhatsApp Profile</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center">
                  <img 
                    src={whatsappProfile.profilePictureUrl || PLACEHOLDER_PROFILE_IMAGE} 
                    alt="WhatsApp Profile" 
                    className="mr-3 h-12 w-12 rounded-full object-cover border-2 border-green-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">
                      {whatsappProfile.profileName || user?.name}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-400">
                      {whatsappProfile.phoneNumber}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-3 rounded-md bg-green-50 p-3 dark:bg-green-900/20">
              <div className="flex items-center">
                <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4"></path>
                    <path d="M12 8h.01"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Tip</p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                   To avoid having your account banned, do not send more than 200-500 messages per day per instance.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Theme section */}
          <div className="border-b border-gray-200 p-4 dark:border-gray-700">
            <h3 className="mb-4 font-medium dark:text-white">Theme</h3>
            
            <div className="flex cursor-pointer items-center justify-between rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
              <div className="flex items-center">
                {darkMode ? (
                  <FaMoon className="mr-3 text-blue-500" />
                ) : (
                  <FaSun className="mr-3 text-yellow-500" />
                )}
                <span className="dark:text-white">{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
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
                  className={`block h-6 w-11 rounded-full ${darkMode ? 'bg-whatsapp-teal' : 'bg-gray-300'} cursor-pointer`}
                >
                  <span 
                    className={`absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white transition-transform ${darkMode ? 'translate-x-5' : ''}`}
                  ></span>
                </label>
              </div>
            </div>
          </div>
          
          {/* Notifications section */}
          <div className="border-b border-gray-200 p-4 dark:border-gray-700">
            <h3 className="mb-4 font-medium dark:text-white">Notifications</h3>
            
            <div className="flex cursor-pointer items-center justify-between rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
              <div className="flex items-center">
                <FaBell className="mr-3 text-red-500" />
                <span className="dark:text-white">Notification Sounds</span>
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
                  className={`block h-6 w-11 rounded-full ${notifications ? 'bg-whatsapp-teal' : 'bg-gray-300'} cursor-pointer`}
                >
                  <span 
                    className={`absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white transition-transform ${notifications ? 'translate-x-5' : ''}`}
                  ></span>
                </label>
              </div>
            </div>
          </div>
          
          {/* Logout */}
          <div className="p-4">
            <button 
              className="flex w-full items-center justify-center rounded-md bg-red-500 py-2 text-white hover:bg-red-600"
              onClick={handleLogout}
            >
              <FaSignOutAlt className="mr-2" />
              Logout
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
    </div>
  );
};

export default Settings; 