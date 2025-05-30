import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { FaArrowLeft, FaUsers, FaSearch, FaTimes } from 'react-icons/fa';
import mockUsers from '../data/mockUsers';

interface NewChatModalProps {
  onClose: () => void;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const { createChat } = useChat();
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<(string | number)[]>([]);
  const [groupName, setGroupName] = useState('');
  
  // Filter out current user and already selected contacts
  const availableContacts = mockUsers.filter(contact => 
    contact.id !== user?.id && 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContactSelect = (contactId: string | number) => {
    if (isCreatingGroup) {
      // For group, add/remove from selected contacts
      if (selectedContacts.includes(contactId)) {
        setSelectedContacts(selectedContacts.filter(id => id !== contactId));
      } else {
        setSelectedContacts([...selectedContacts, contactId]);
      }
    } else {
      // For 1:1 chat, create immediately
      handleCreateChat([contactId], false);
    }
  };

  const handleCreateChat = async (participantIds: (string | number)[], isGroup: boolean) => {
    try {
      const newChat = await createChat(
        participantIds, 
        isGroup,
        isGroup ? groupName : undefined
      );
      onClose();
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleCreateGroup = () => {
    if (selectedContacts.length > 0 && groupName.trim()) {
      handleCreateChat(selectedContacts, true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-0 overflow-hidden dark:bg-gray-800">
        {/* Modal header */}
        <div className="px-6 pt-6 pb-2 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">New chat</h2>
          
          {/* Search input */}
          <div className="relative mb-2">
            <input
              type="text"
              placeholder="Search name or number"
              className="w-full rounded-md bg-gray-100 text-gray-800 placeholder-gray-500 px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[#00a884] border border-transparent focus:border-[#00a884] dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4-4m0 0A7 7 0 104 4a7 7 0 0013 13z" />
              </svg>
            </span>
          </div>
        </div>
        
        {/* Contacts list */}
        <div className="max-h-96 overflow-y-auto px-2 py-2 bg-white dark:bg-gray-800">
          {isCreatingGroup ? (
            <>
              {/* Group creation UI */}
              <div className="p-4">
                <div className="mb-4">
                  <label htmlFor="groupName" className="mb-1 block text-sm text-gray-600 dark:text-gray-300">
                    Group Name:
                  </label>
                  <input
                    type="text"
                    id="groupName"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name"
                    className="w-full rounded-md border border-gray-300 p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                
                <div className="mb-4">
                  <p className="mb-1 text-sm text-gray-600 dark:text-gray-300">
                    Selected Contacts ({selectedContacts.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedContacts.map(contactId => {
                      const contact = mockUsers.find(u => u.id === contactId);
                      return (
                        <div 
                          key={contactId}
                          className="flex items-center rounded-full bg-gray-200 px-3 py-1 dark:bg-gray-700"
                        >
                          <span className="mr-1 text-sm dark:text-white">{contact?.name}</span>
                          <button 
                            onClick={() => handleContactSelect(contactId)}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                          >
                            <FaTimes size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <button 
                  onClick={handleCreateGroup}
                  disabled={selectedContacts.length === 0 || !groupName.trim()}
                  className={`w-full rounded-md bg-whatsapp-teal py-2 text-white ${
                    selectedContacts.length === 0 || !groupName.trim() 
                      ? 'cursor-not-allowed opacity-50' 
                      : 'hover:bg-whatsapp-dark-green'
                  }`}
                >
                  Create Group
                </button>
              </div>
              
              <div className="px-4 pb-2 pt-4">
                <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                  Add Participants:
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Create group option */}
              <div 
                className="flex cursor-pointer items-center border-b border-gray-200 p-4 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                onClick={() => setIsCreatingGroup(true)}
              >
                <div className="mr-3 flex h-12 w-12 items-center justify-center rounded-full bg-whatsapp-teal text-white">
                  <FaUsers size={20} />
                </div>
                <span className="text-lg dark:text-white">New Group</span>
              </div>
            </>
          )}
          
          {/* Contacts list */}
          <div className="overflow-y-auto">
            {availableContacts.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-gray-500 dark:text-gray-400">
                <p>No contacts found</p>
              </div>
            ) : (
              availableContacts.map(contact => (
                <div 
                  key={contact.id}
                  className={`flex cursor-pointer items-center border-b border-gray-200 p-4 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 ${
                    isCreatingGroup && selectedContacts.includes(contact.id) 
                      ? 'bg-gray-100 dark:bg-gray-800' 
                      : ''
                  }`}
                  onClick={() => handleContactSelect(contact.id)}
                >
                  <div className="relative mr-3">
                    <img 
                      src={contact.avatar} 
                      alt={contact.name} 
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    {contact.isOnline && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-whatsapp-light-green"></span>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-medium dark:text-white">{contact.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{contact.status}</p>
                  </div>
                  
                  {isCreatingGroup && selectedContacts.includes(contact.id) && (
                    <div className="ml-auto h-6 w-6 rounded-full bg-whatsapp-light-green text-center text-white">
                      ✓
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal; 