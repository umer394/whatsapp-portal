import React from 'react';
import { 
  FaUsers, 
  FaBullhorn, 
  FaChartBar, 
  FaCog
} from 'react-icons/fa';

interface MobileNavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const MobileNavBar: React.FC<MobileNavBarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50 mobile-only">
      <div className="flex justify-around items-center h-16">
        <button 
          onClick={() => onTabChange('contacts')}
          className={`flex flex-col items-center justify-center w-1/4 h-full ${activeTab === 'contacts' ? 'text-green-500' : 'text-gray-600 dark:text-gray-400'}`}
        >
          <FaUsers size={20} />
          <span className="text-xs mt-1">Contacts</span>
        </button>
        
        <button 
          onClick={() => onTabChange('campaigns')}
          className={`flex flex-col items-center justify-center w-1/4 h-full ${activeTab === 'campaigns' ? 'text-green-500' : 'text-gray-600 dark:text-gray-400'}`}
        >
          <FaBullhorn size={20} />
          <span className="text-xs mt-1">Campaigns</span>
        </button>
        
        <button 
          onClick={() => onTabChange('analytics')}
          className={`flex flex-col items-center justify-center w-1/4 h-full ${activeTab === 'analytics' ? 'text-green-500' : 'text-gray-600 dark:text-gray-400'}`}
        >
          <FaChartBar size={20} />
          <span className="text-xs mt-1">Analytics</span>
        </button>
        
        <button 
          onClick={() => onTabChange('settings')}
          className={`flex flex-col items-center justify-center w-1/4 h-full ${activeTab === 'settings' ? 'text-green-500' : 'text-gray-600 dark:text-gray-400'}`}
        >
          <FaCog size={20} />
          <span className="text-xs mt-1">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default MobileNavBar; 