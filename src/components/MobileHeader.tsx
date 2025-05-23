import React from 'react';
import { FaSearch, FaEllipsisV } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';

interface MobileHeaderProps {
  activeTab: string;
  onSearchClick?: () => void;
  onMenuClick?: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ 
  activeTab, 
  onSearchClick,
  onMenuClick
}) => {
  const { darkMode } = useTheme();
  
  // Get title based on active tab
  const getTitle = () => {
    switch (activeTab) {
      case 'contacts':
        return 'Chats';
      case 'campaigns':
        return 'Campaigns';
      case 'analytics':
        return 'Analytics';
      case 'settings':
        return 'Settings';
      default:
        return 'WABI';
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-[#00a884] text-white z-50 mobile-only">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center">
          {/* Logo and title */}
          <div className="flex items-center">
            <svg width="24" height="24" viewBox="0 0 122.88 122.31" className="mr-2">
              <defs>
                <linearGradient id="whatsapp-gradient-mobile" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#25D366" />
                  <stop offset="100%" stopColor="#128C7E" />
                </linearGradient>
              </defs>
              <path fill="#fff" d="M27.75,0H95.13a27.83,27.83,0,0,1,27.75,27.75V94.57a27.83,27.83,0,0,1-27.75,27.74H27.75A27.83,27.83,0,0,1,0,94.57V27.75A27.83,27.83,0,0,1,27.75,0Z"/>
              <path fill="#00a884" d="M61.44,25.39A35.76,35.76,0,0,0,31.18,80.18L27.74,94.86l14.67-3.44a35.77,35.77,0,1,0,19-66ZM41,95.47,35.1,96.85l.94,4,4.35-1a43.36,43.36,0,0,0,10.46,4l1-4A40,40,0,0,1,41,95.45l0,0ZM21.76,86.53l4,.93,1.37-5.91a39.6,39.6,0,0,1-4.43-10.82l-4,1a44.23,44.23,0,0,0,4.06,10.46l-1,4.35Zm9.68,11.15-8.52,2,2-8.52-4-.93-2,8.51a4.12,4.12,0,0,0,3.08,5,4,4,0,0,0,1.88,0l8.52-2-.94-4.06Zm24-76a40.56,40.56,0,0,1,12,0L68,17.63a44.25,44.25,0,0,0-13.2,0l.63,4.07ZM99.14,38.4l-3.53,2.12a39.89,39.89,0,0,1,4.57,11l4-1a43.75,43.75,0,0,0-5-12.18Zm-69.81-.91A40.29,40.29,0,0,1,37.78,29l-2.47-3.32A43.62,43.62,0,0,0,26,35l3.32,2.47ZM85.1,29a40.11,40.11,0,0,1,8.46,8.45L96.88,35a43.62,43.62,0,0,0-9.3-9.3L85.1,29Zm8.46,55.78a40.11,40.11,0,0,1-8.46,8.45l2.45,3.32a44,44,0,0,0,9.33-9.3l-3.32-2.47ZM67.42,100.6a39.89,39.89,0,0,1-12,0l-.62,4.09a44.18,44.18,0,0,0,13.19,0l-.62-4.09Zm36.76-28.88-4-1A40,40,0,0,1,95.6,81.8l3.53,2.12a43.72,43.72,0,0,0,5.05-12.2Zm-2.84-10.57a39.93,39.93,0,0,1-.45,6l4.07.62a44.18,44.18,0,0,0,0-13.19l-4.07.62a39.8,39.8,0,0,1,.45,6ZM84.2,98.85l-2.12-3.53a39.89,39.89,0,0,1-11,4.57l1,4a43.75,43.75,0,0,0,12.18-5ZM21.55,61.15a41.15,41.15,0,0,1,.44-6l-4.07-.62a44.18,44.18,0,0,0,0,13.19L22,67.13a41.28,41.28,0,0,1-.44-6Zm2.2-22.75A43.83,43.83,0,0,0,18.7,50.59l4,1a40.08,40.08,0,0,1,4.57-11.06L23.75,38.4ZM72,18.41l-1,4A40.08,40.08,0,0,1,82.08,27l2.13-3.53A44,44,0,0,0,72,18.41Zm-21.13,0,1,4A40.08,40.08,0,0,0,40.8,27l-2.12-3.53a44,44,0,0,1,12.2-5.05Z"/>
            </svg>
            <h1 className="text-lg font-medium">{getTitle()}</h1>
          </div>
        </div>
        
        <div className="flex items-center">
          <button 
            onClick={onSearchClick}
            className="p-2 rounded-full hover:bg-[#128C7E] mr-2"
            aria-label="Search"
          >
            <FaSearch size={18} />
          </button>
          
          <button 
            onClick={onMenuClick}
            className="p-2 rounded-full hover:bg-[#128C7E]"
            aria-label="Menu"
          >
            <FaEllipsisV size={18} />
          </button>
        </div>
      </div>
      
      {/* Search bar - shown below header */}
      <div className="px-4 pb-3">
        <div className="bg-white dark:bg-gray-700 flex items-center rounded-full px-3 py-1">
          <FaSearch className="text-gray-500 dark:text-gray-400 mr-2" size={14} />
          <input 
            type="text" 
            placeholder="Search or start new chat" 
            className="bg-transparent border-none flex-1 py-1 text-sm text-gray-800 dark:text-white focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default MobileHeader; 