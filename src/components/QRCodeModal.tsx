import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaTimes } from 'react-icons/fa';

interface QRCodeModalProps {
  onClose: () => void;
  onConnect?: () => void;
}

interface QRCodeResponse {
  connected: boolean;
  qrCode: string;
  instanceKey: string;
  qrUrl: string;
  qrPageUrl: string;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ onClose, onConnect }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { checkWhatsAppStatus } = useAuth();
  const [qrData, setQrData] = useState<QRCodeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const apiCallInProgressRef = useRef<boolean>(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const alreadyConnectedRef = useRef(false);
  const lastCheckTimeRef = useRef<number>(0);
  const statusCheckMinInterval = 5000; // Minimum 5 seconds between status checks
  
  // Cleanup function to stop all intervals
  const cleanupIntervals = useCallback(() => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
  }, []);

  // Completely separate function to check connection status
  // This function doesn't depend on any props or state to avoid re-renders
  const checkConnectionStatus = useCallback(async () => {
    // Prevent concurrent status checks
    if (isCheckingStatus || alreadyConnectedRef.current) return false;
    
    // Implement debounce to prevent too many API calls
    const now = Date.now();
    if (now - lastCheckTimeRef.current < statusCheckMinInterval) {
      console.log("Skipping status check - too soon since last check");
      return false;
    }
    
    lastCheckTimeRef.current = now;
    setIsCheckingStatus(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsCheckingStatus(false);
        return false;
      }
      
      console.log("Checking WhatsApp connection status...");
      const response = await fetch('https://v3-wabi.cloudious.net/api/WhatsApp/InstanceStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      console.log("WhatsApp status response:", data);
      
      // If connected, update the UI immediately
      if (data.state === "CONNECTED") {
        setQrData(prev => prev ? { ...prev, connected: true } : prev);
        alreadyConnectedRef.current = true;
      }
      
      setIsCheckingStatus(false);
      return data.state === "CONNECTED";
    } catch (err) {
      console.error('Error checking WhatsApp connection status:', err);
      setIsCheckingStatus(false);
      return false;
    }
  }, [isCheckingStatus]);

  // Start polling for connection status
  const startConnectionPolling = useCallback(() => {
    // Clean up any existing interval
    cleanupIntervals();
    
    // Set up new interval only if not already connected
    if (!alreadyConnectedRef.current) {
      console.log("Starting connection polling...");
      checkIntervalRef.current = setInterval(async () => {
        if (alreadyConnectedRef.current) {
          cleanupIntervals();
          return;
        }
        
        const connected = await checkConnectionStatus();
        if (connected) {
          // Stop polling
          cleanupIntervals();
          
          // Update WhatsApp status in AuthContext
          await checkWhatsAppStatus();
          
          // Notify parent components
          if (onConnect) {
            onConnect();
          }
          
          // Close modal
          onClose();
        }
      }, 30000);
    }
  }, [checkConnectionStatus, onConnect, onClose, checkWhatsAppStatus, cleanupIntervals]);

  // Function to fetch QR code - completely separate from connection checking
  const fetchQRCode = useCallback(async () => {
    // Prevent multiple simultaneous API calls
    if (apiCallInProgressRef.current || alreadyConnectedRef.current) return;
    
    apiCallInProgressRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        apiCallInProgressRef.current = false;
        return;
      }
      
      console.log("Fetching QR code...");
      const response = await fetch('https://v3-wabi.cloudious.net/api/WhatsApp/ConnectInstance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Try to get the text response for better error messages
        const textResponse = await response.text();
        throw new Error(`Server returned a non-JSON response: ${textResponse || response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setQrData(data.data);
        
        // If WhatsApp is already connected, trigger the onConnect callback
        if (data.data.connected) {
          alreadyConnectedRef.current = true;
          
          if (onConnect) {
            // Wait a moment to ensure the UI updates before closing
            setTimeout(() => {
              onConnect();
              onClose();
            }, 2000);
          }
        }
      } else {
        // Handle error response
        if (data.data?.rawResponse?.includes("502 Bad Gateway")) {
          setError("Server is temporarily unavailable. Please try again later.");
        } else {
          setError(data.message || 'Failed to generate QR code');
        }
      }
    } catch (err) {
      console.error('Error fetching QR code:', err);
      if (err instanceof Error && err.message.includes("502 Bad Gateway")) {
        setError("Server is temporarily unavailable. Please try again later.");
      } else {
        setError('Failed to connect to WhatsApp. Please try again.');
      }
    } finally {
      setLoading(false);
      apiCallInProgressRef.current = false;
    }
  }, [onConnect, onClose]);

  // Fetch QR code on mount - only once
  useEffect(() => {
    let isMounted = true;
    
    const initializeQRCode = async () => {
      try {
        // Check if already connected first
        const connected = await checkConnectionStatus();
        
        if (!isMounted) return;
        
        if (connected) {
          alreadyConnectedRef.current = true;
          // Update WhatsApp status and notify
          await checkWhatsAppStatus();
          
          if (onConnect && isMounted) {
            onConnect();
          }
          // Close modal after a short delay
          if (isMounted) {
            setTimeout(onClose, 1000);
          }
        } else if (isMounted) {
          // Only fetch QR code if not connected
          await fetchQRCode();
          
          // Start polling for connection status after QR code is fetched
          if (isMounted && !alreadyConnectedRef.current) {
            startConnectionPolling();
          }
        }
      } catch (error) {
        console.error("Error initializing QR code:", error);
      }
    };
    
    initializeQRCode();
    
    // Clean up on unmount
    return () => {
      isMounted = false;
      cleanupIntervals();
    };
  }, [fetchQRCode, startConnectionPolling, checkConnectionStatus, checkWhatsAppStatus, onConnect, onClose, cleanupIntervals]);

  // Handle click outside to close the modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Handle escape key to close modal
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Add a retry button for when there's an error
  const handleRetry = () => {
    fetchQRCode().then(() => {
      startConnectionPolling();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden dark:bg-gray-800">
        {/* Modal header */}
        <div className="flex items-center justify-between bg-white px-6 py-4 border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Connect with WhatsApp</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 focus:outline-none dark:text-gray-400 dark:hover:text-gray-300"
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        {/* Modal content */}
        <div className="bg-white px-6 py-6 dark:bg-gray-800">
          {loading ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent"></div>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">Connecting to WhatsApp</h3>
              <p className="text-gray-600 dark:text-gray-300">Please wait while we establish the connection...</p>
            </div>
          ) : error ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400">
                <FaTimes size={32} />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">Connection Error</h3>
              <p className="mb-4 text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={handleRetry}
                className="rounded-md bg-green-500 px-4 py-2 text-white hover:bg-green-600"
              >
                Try Again
              </button>
            </div>
          ) : qrData?.connected ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent"></div>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">WhatsApp Connected</h3>
              <p className="text-gray-600 dark:text-gray-300">Your WhatsApp account is successfully linked to this device.</p>
            </div>
          ) : qrData?.qrCode ? (
            <>
              <div className="text-center">
                <div className="flex justify-center">
                  <img 
                    src={qrData.qrCode} 
                    alt="WhatsApp QR Code" 
                    className="h-64 w-64 rounded-lg"
                  />
                </div>
                <div className="mt-6 px-2">
                  <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">1. Open WhatsApp on your phone</h3>
                  <p className="mb-4 text-gray-600 dark:text-gray-300">
                    Go to Settings {'>>'} Linked Devices {'>>'} Link a Device
                  </p>
                  <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">2. Scan the QR code</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Point your phone to this screen to capture the code
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="flex h-64 w-64 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent"></div>
              </div>
              <div className="mt-6 px-2">
                <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">1. Open WhatsApp on your phone</h3>
                <p className="mb-4 text-gray-600 dark:text-gray-300">
                  Go to Settings {'>>'} Linked Devices {'>>'} Link a Device
                </p>
                <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">2. Scan the QR code</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Point your phone to this screen to capture the code
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Modal footer */}
        <div className="flex justify-end gap-2 bg-gray-50 px-6 py-3 dark:bg-gray-700">
          <button 
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal; 