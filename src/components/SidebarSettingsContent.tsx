import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';

// This component is extracted from the Sidebar.tsx file and modified for standalone use
const SidebarSettingsContent: React.FC = () => {
  const { user, updateUser, logout, whatsappConnected, whatsappProfile, whatsappLoading, checkWhatsAppStatus } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
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
      const response = await fetch('https://v3-wabi.cloudious.net/api/WhatsApp/LogoutInstance', {
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

  const handleLogout = () => {
    showToast('success', 'Logged out successfully');
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full overflow-auto pb-24">
      {/* Profile section - compact with logo fallback */}
      <div className="flex flex-col items-center justify-center py-6">
        <div className="w-24 h-24 rounded-full overflow-hidden mb-3">
          {whatsappConnected && whatsappProfile?.profilePictureUrl ? (
            <img 
              src={whatsappProfile.profilePictureUrl}
              alt="WhatsApp Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-green-50">
              <svg width="48" height="48" viewBox="0 0 122.88 122.31">
                <defs>
                  <linearGradient id="whatsapp-gradient-mobile" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#25D366" />
                    <stop offset="100%" stopColor="#128C7E" />
                  </linearGradient>
                </defs>
                <path fill="url(#whatsapp-gradient-mobile)" d="M27.75,0H95.13a27.83,27.83,0,0,1,27.75,27.75V94.57a27.83,27.83,0,0,1-27.75,27.74H27.75A27.83,27.83,0,0,1,0,94.57V27.75A27.83,27.83,0,0,1,27.75,0Z"/>
                <path fill="#fff" d="M61.44,25.39A35.76,35.76,0,0,0,31.18,80.18L27.74,94.86l14.67-3.44a35.77,35.77,0,1,0,19-66ZM41,95.47,35.1,96.85l.94,4,4.35-1a43.36,43.36,0,0,0,10.46,4l1-4A40,40,0,0,1,41,95.45l0,0ZM21.76,86.53l4,.93,1.37-5.91a39.6,39.6,0,0,1-4.43-10.82l-4,1a44.23,44.23,0,0,0,4.06,10.46l-1,4.35Zm9.68,11.15-8.52,2,2-8.52-4-.93-2,8.51a4.12,4.12,0,0,0,3.08,5,4,4,0,0,0,1.88,0l8.52-2-.94-4.06Zm24-76a40.56,40.56,0,0,1,12,0L68,17.63a44.25,44.25,0,0,0-13.2,0l.63,4.07ZM99.14,38.4l-3.53,2.12a39.89,39.89,0,0,1,4.57,11l4-1a43.75,43.75,0,0,0-5-12.18Zm-69.81-.91A40.29,40.29,0,0,1,37.78,29l-2.47-3.32A43.62,43.62,0,0,0,26,35l3.32,2.47ZM85.1,29a40.11,40.11,0,0,1,8.46,8.45L96.88,35a43.62,43.62,0,0,0-9.3-9.3L85.1,29Zm8.46,55.78a40.11,40.11,0,0,1-8.46,8.45l2.45,3.32a44,44,0,0,0,9.33-9.3l-3.32-2.47ZM67.42,100.6a39.89,39.89,0,0,1-12,0l-.62,4.09a44.18,44.18,0,0,0,13.19,0l-.62-4.09Zm36.76-28.88-4-1A40,40,0,0,1,95.6,81.8l3.53,2.12a43.72,43.72,0,0,0,5.05-12.2Zm-2.84-10.57a39.93,39.93,0,0,1-.45,6l4.07.62a44.18,44.18,0,0,0,0-13.19l-4.07.62a39.8,39.8,0,0,1,.45,6ZM84.2,98.85l-2.12-3.53a39.89,39.89,0,0,1-11,4.57l1,4a43.75,43.75,0,0,0,12.18-5ZM21.55,61.15a41.15,41.15,0,0,1,.44-6l-4.07-.62a44.18,44.18,0,0,0,0,13.19L22,67.13a41.28,41.28,0,0,1-.44-6Zm2.2-22.75A43.83,43.83,0,0,0,18.7,50.59l4,1a40.08,40.08,0,0,1,4.57-11.06L23.75,38.4ZM72,18.41l-1,4A40.08,40.08,0,0,1,82.08,27l2.13-3.53A44,44,0,0,0,72,18.41Zm-21.13,0,1,4A40.08,40.08,0,0,0,40.8,27l-2.12-3.53a44,44,0,0,1,12.2-5.05Z"/>
              </svg>
            </div>
          )}
        </div>
        {!whatsappConnected || !whatsappProfile?.profilePictureUrl ? (
          <span className="text-lg font-bold mb-1">WABI</span>
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
              className="flex items-center justify-center px-4 py-2 rounded-md text-white text-sm font-medium shadow-sm transition-all 
                bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 
                disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isDisconnectingWhatsApp ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Disconnecting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Disconnect WhatsApp
                </>
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* Green Tip section with info icon */}
      <div className="bg-green-50 mx-4 mb-5 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0 mr-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border-2 border-green-500">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div>
            <p className="font-medium text-base text-green-800">Tip</p>
            <p className="text-sm text-green-700">To avoid having your account banned, do not send more than 200-500 messages per day per instance.</p>
          </div>
        </div>
      </div>
      
      {/* Theme section */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <h3 className="px-4 pt-4 pb-2 font-medium text-gray-900 dark:text-white text-lg">Theme</h3>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-yellow-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
            <span className="text-base text-gray-700 dark:text-gray-300">Light Mode</span>
          </div>
          
          <div className="relative">
            <input 
              type="checkbox" 
              id="theme-toggle-mobile"
              className="sr-only"
              checked={darkMode}
              onChange={toggleDarkMode}
            />
            <label 
              htmlFor="theme-toggle-mobile"
              className={`block h-7 w-14 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${darkMode ? 'bg-gray-400' : 'bg-green-500'}`}
            >
              <span 
                className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${darkMode ? 'translate-x-7' : ''}`}
              ></span>
            </label>
          </div>
        </div>
      </div>
      
      {/* Notifications section */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <h3 className="px-4 pt-4 pb-2 font-medium text-gray-900 dark:text-white text-lg">Notifications</h3>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            <span className="text-base text-gray-700 dark:text-gray-300">Notification Sounds</span>
          </div>
          
          <div className="relative">
            <input 
              type="checkbox" 
              id="notifications-toggle-mobile"
              className="sr-only"
              checked={notifications}
              onChange={() => setNotifications(!notifications)}
            />
            <label 
              htmlFor="notifications-toggle-mobile"
              className={`block h-7 w-14 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${notifications ? 'bg-green-500' : 'bg-gray-400'}`}
            >
              <span 
                className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${notifications ? 'translate-x-7' : ''}`}
              ></span>
            </label>
          </div>
        </div>
      </div>
      
      {/* Logout */}
      <div className="px-4 pt-5 pb-4 mt-auto">
        <button 
          onClick={handleLogout}
          className="w-full bg-red-500 text-white py-3 rounded-md flex items-center justify-center font-medium hover:bg-red-600 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
};

export default SidebarSettingsContent; 