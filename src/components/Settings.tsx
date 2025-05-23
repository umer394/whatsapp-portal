/**
 * DEPRECATED: This standalone Settings component has been replaced by the settings tab in Sidebar.tsx
 * The functionality has been moved to the SettingsContent component inside Sidebar.tsx
 * This file is kept for reference but is no longer used in the application.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { FaMoon, FaSun, FaBell, FaSignOutAlt, FaWhatsapp, FaSpinner } from 'react-icons/fa';
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
    // Show logout toast
    showToast('success', 'Logged out successfully');
    
    // Perform logout action
    logout();
    
    // Navigate to login page
    navigate('/login');
    
    // Close settings on mobile
    onClose();
  };
  
  const disconnectWhatsApp = async () => {
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
  };
  
  return (
    <div className="h-full w-full bg-white dark:bg-gray-900">
      <div 
        ref={settingsRef}
        className="h-full w-full overflow-auto pb-28" // Increased bottom padding for mobile
      >
        {/* Profile section */}
        <div className="border-b border-gray-200 p-5 dark:border-gray-700">
          <div className="flex flex-col items-center">
            {/* Profile image */}
            <div className="mb-4">
              <div className="relative">
                {whatsappConnected && whatsappProfile ? (
                  <img 
                    src={whatsappProfile.profilePictureUrl || PLACEHOLDER_PROFILE_IMAGE}
                    alt="WhatsApp Profile"
                    className="h-24 w-24 rounded-full object-cover border-2 border-green-100"
                  />
                ) : (
                  <img 
                    src={user?.avatar || PLACEHOLDER_PROFILE_IMAGE}
                    alt="Profile"
                    className="h-24 w-24 rounded-full object-cover border-2 border-gray-100"
                  />
                )}
              </div>
            </div>
            
            {/* User name */}
            <div className="mb-3 w-full text-center">
              {isEditingName && !whatsappConnected ? (
                <div className="w-full max-w-xs mx-auto">
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2 text-center dark:border-gray-600 dark:bg-gray-800 dark:text-white text-base"
                    placeholder="Your name"
                    autoFocus
                  />
                  <div className="mt-3 flex justify-center">
                    <button 
                      className="mr-3 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      onClick={() => setIsEditingName(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
                      onClick={handleUpdateProfile}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <h3 className="text-xl font-medium dark:text-white mb-1">
                  {whatsappConnected && whatsappProfile ? 
                    (whatsappProfile.profileName ? 
                      whatsappProfile.profileName : user?.name) 
                    : user?.name}
                </h3>
              )}
            </div>
            
            {/* WhatsApp connection button */}
            {whatsappConnected ? (
              <button 
                className="mt-2 rounded-md bg-red-500 px-4 py-2 text-base font-medium text-white hover:bg-red-600 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center w-auto"
                onClick={disconnectWhatsApp}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <>
                    <FaSpinner className="mr-2 animate-spin" size={16} />
                    Disconnecting...
                  </>
                ) : (
                  'Disconnect WhatsApp'
                )}
              </button>
            ) : null}
          </div>
          
          {/* WhatsApp Profile Information */}
          {whatsappConnected && whatsappProfile && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center">
                <FaWhatsapp className="mr-3 text-green-500 flex-shrink-0" size={22} />
                <span className="font-medium text-green-800 dark:text-green-300 text-lg">WhatsApp Profile</span>
              </div>
              <div className="mt-3 flex items-center">
                <img 
                  src={whatsappProfile.profilePictureUrl || PLACEHOLDER_PROFILE_IMAGE} 
                  alt="WhatsApp Profile" 
                  className="mr-3 h-12 w-12 rounded-full object-cover border-2 border-green-500 flex-shrink-0"
                />
                <div>
                  <p className="text-base font-medium text-green-800 dark:text-green-300">
                    {whatsappProfile.profileName || user?.name}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    {whatsappProfile.phoneNumber}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Tip section */}
          <div className="mt-5 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <div className="flex">
              <div className="mr-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
              </div>
              <div>
                <p className="text-base font-medium text-green-700 dark:text-green-300">Ti</p>
                <p className="text-sm text-green-600 dark:text-green-400">
                 To avoid having your account banned, do not send more than 200-500 messages per day per instance.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Theme section */}
        <div className="border-b border-gray-200 px-5 py-6 dark:border-gray-700">
          <h3 className="mb-4 text-lg font-medium dark:text-white">Theme</h3>
          
          <div className="flex cursor-pointer items-center justify-between rounded-md p-3 hover:bg-gray-100 dark:hover:bg-gray-800">
            <div className="flex items-center">
              {darkMode ? (
                <FaMoon className="mr-4 text-blue-500" size={20} />
              ) : (
                <FaSun className="mr-4 text-yellow-500" size={20} />
              )}
              <span className="text-base dark:text-white">{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
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
                className={`block h-7 w-14 rounded-full ${darkMode ? 'bg-green-500' : 'bg-gray-300'} cursor-pointer`}
              >
                <span 
                  className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform ${darkMode ? 'translate-x-7' : ''}`}
                ></span>
              </label>
            </div>
          </div>
        </div>
        
        {/* Notifications section */}
        <div className="border-b border-gray-200 px-5 py-6 dark:border-gray-700">
          <h3 className="mb-4 text-lg font-medium dark:text-white">Notifications</h3>
          
          <div className="flex cursor-pointer items-center justify-between rounded-md p-3 hover:bg-gray-100 dark:hover:bg-gray-800">
            <div className="flex items-center">
              <FaBell className="mr-4 text-red-500" size={20} />
              <span className="text-base dark:text-white">Notification Sounds</span>
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
                className={`block h-7 w-14 rounded-full ${notifications ? 'bg-green-500' : 'bg-gray-300'} cursor-pointer`}
              >
                <span 
                  className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform ${notifications ? 'translate-x-7' : ''}`}
                ></span>
              </label>
            </div>
          </div>
        </div>
        
        {/* Logout */}
        <div className="px-5 py-6">
          <button 
            className="flex w-full items-center justify-center rounded-md bg-red-500 py-3 px-4 text-base font-medium text-white hover:bg-red-600"
            onClick={handleLogout}
          >
            <FaSignOutAlt className="mr-3" size={18} />
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
  );
};

export default Settings; 