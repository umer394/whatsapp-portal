import React, { useState } from 'react';
import { FaPlus, FaComment, FaBullhorn, FaUserPlus } from 'react-icons/fa';

interface FloatingActionButtonProps {
  onNewChat?: () => void;
  onNewCampaign?: () => void;
  onNewContact?: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onNewChat,
  onNewCampaign,
  onNewContact
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed right-4 bottom-20 z-50 mobile-only">
      {/* Sub-buttons that appear when the main button is clicked */}
      {isOpen && (
        <div className="flex flex-col-reverse gap-3 mb-3">
          {onNewChat && (
            <button
              onClick={() => {
                onNewChat();
                setIsOpen(false);
              }}
              className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center shadow-lg"
              aria-label="New Chat"
            >
              <FaComment size={20} />
            </button>
          )}
          
          {onNewCampaign && (
            <button
              onClick={() => {
                onNewCampaign();
                setIsOpen(false);
              }}
              className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-lg"
              aria-label="New Campaign"
            >
              <FaBullhorn size={20} />
            </button>
          )}
          
          {onNewContact && (
            <button
              onClick={() => {
                onNewContact();
                setIsOpen(false);
              }}
              className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shadow-lg"
              aria-label="New Contact"
            >
              <FaUserPlus size={20} />
            </button>
          )}
        </div>
      )}
      
      {/* Main floating action button */}
      <button
        onClick={toggleMenu}
        className={`w-14 h-14 rounded-full bg-[#00a884] text-white flex items-center justify-center shadow-lg transition-transform ${isOpen ? 'rotate-45' : ''}`}
        aria-label="Menu"
      >
        <FaPlus size={24} />
      </button>
    </div>
  );
};

export default FloatingActionButton; 