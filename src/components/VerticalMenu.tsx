import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FaComment, 
  FaAddressBook, 
  FaBullhorn, 
  FaChartBar, 
  FaSignOutAlt,
  FaCog
} from 'react-icons/fa';

interface VerticalMenuProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenSettings: () => void;
}

const VerticalMenu: React.FC<VerticalMenuProps> = ({ 
  activeTab, 
  onTabChange,
  onOpenSettings
}) => {
  const { logout } = useAuth();
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
  };

  const menuItems = [
    { id: 'contacts', icon: <FaAddressBook size={20} />, label: 'Contacts' },
    { id: 'chat', icon: <FaComment size={20} />, label: 'Chat' },
    { id: 'campaigns', icon: <FaBullhorn size={20} />, label: 'Campaigns' },
    { id: 'analytics', icon: <FaChartBar size={20} />, label: 'Analytics' },
  ];

  const bottomItems = [
    { id: 'settings', icon: <FaCog size={20} />, label: 'Settings', action: onOpenSettings },
    { id: 'logout', icon: <FaSignOutAlt size={20} />, label: 'Logout', action: handleLogout },
  ];

  return (
    <div className="flex h-full w-16 flex-col items-center justify-between bg-gray-100 py-4 dark:bg-gray-800">
      {/* Top menu items */}
      <div className="flex w-full flex-col items-center space-y-6">
        {menuItems.map((item) => (
          <div 
            key={item.id}
            className="relative w-full flex justify-center"
            onMouseEnter={() => setShowTooltip(item.id)}
            onMouseLeave={() => setShowTooltip(null)}
          >
            <button
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                activeTab === item.id
                  ? 'bg-[#25D366] text-white'
                  : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
              onClick={() => onTabChange(item.id)}
              aria-label={item.label}
            >
              {item.icon}
            </button>
            
            {showTooltip === item.id && (
              <div className="absolute left-16 z-10 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white">
                {item.label}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom menu items */}
      <div className="flex w-full flex-col items-center space-y-6">
        {bottomItems.map((item) => (
          <div 
            key={item.id}
            className="relative w-full flex justify-center"
            onMouseEnter={() => setShowTooltip(item.id)}
            onMouseLeave={() => setShowTooltip(null)}
          >
            <button
              className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition-all hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
              onClick={item.action}
              aria-label={item.label}
            >
              {item.icon}
            </button>
            
            {showTooltip === item.id && (
              <div className="absolute left-16 z-10 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white">
                {item.label}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VerticalMenu; 