import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FaComment, 
  FaAddressBook, 
  FaBullhorn, 
  FaChartBar, 
  FaSignOutAlt,
  FaCog,
  FaFileInvoiceDollar
} from 'react-icons/fa';

interface VerticalMenuProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenSettings: () => void;
  iconHighlightColor?: string;
}

const VerticalMenu: React.FC<VerticalMenuProps> = ({ 
  activeTab, 
  onTabChange,
  onOpenSettings,
  iconHighlightColor
}) => {
  const { logout } = useAuth();
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
  };

  const menuItems = [
    { id: 'campaigns', icon: <FaBullhorn size={20} />, label: 'Campaigns' },
    { id: 'contacts', icon: <FaAddressBook size={20} />, label: 'Contacts' },
    // { id: 'chat', icon: <FaComment size={20} />, label: 'Chat' },
    { id: 'analytics', icon: <FaChartBar size={20} />, label: 'Analytics' },
    { id: 'invoices', icon: <FaFileInvoiceDollar size={20} />, label: 'Send Invoices' },
    { id: 'settings', icon: <FaCog size={20} />, label: 'Settings' },
  ];

  const bottomItems = [
   
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
                  ? 'text-white'
                  : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
              style={activeTab === item.id && iconHighlightColor ? { background: iconHighlightColor } : {}}
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