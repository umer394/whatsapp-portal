import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { gradients } from '../styles/theme';

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
      const response = await fetch('https://api-ibico.cloudious.net/api/WhatsApp/InstanceStatus', {
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
      const response = await fetch('https://api-ibico.cloudious.net/api/WhatsApp/ConnectInstance', {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div 
        ref={modalRef}
        className="relative w-full max-w-md rounded-lg bg-white shadow-lg"
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* QR Code */}
        <div className="flex justify-center pt-6 px-6">
          <div className="relative h-64 w-64 overflow-hidden">
            {loading ? (
              <div className="flex h-full w-full items-center justify-center bg-gray-100">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-t-4 border-gray-200 border-t-green-500"></div>
              </div>
            ) : error ? (
              <div className="flex h-full w-full flex-col items-center justify-center bg-red-50 p-4 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-red-600 mb-3">{error}</p>
                <button 
                  onClick={handleRetry}
                  className="rounded-md px-3 py-1 text-sm text-white hover:opacity-90"
                  style={{ background: gradients.primary.background }}
                >
                  Retry
                </button>
              </div>
            ) : qrData?.connected ? (
              <div className="flex h-full w-full flex-col items-center justify-center bg-green-50 text-center">
                <div className="mb-4 rounded-full bg-green-100 p-4 text-green-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="mb-1 text-lg font-medium text-green-800">WhatsApp Connected</h3>
                <p className="text-sm text-green-600">Your WhatsApp account is already connected to this device.</p>
              </div>
            ) : qrData?.qrCode ? (
              <>
                <img 
                  src={qrData.qrCode} 
                  alt="WhatsApp QR Code" 
                  className="h-full w-full"
                />
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100">
                <p className="text-sm text-gray-500">QR Code not available</p>
              </div>
            )}
          </div>
        </div>

        {/* Login text */}
        <div className="px-6">
          {qrData?.connected ? (
            <>
              <h2 className="mb-1 text-center text-xl font-medium text-gray-800">
                WhatsApp Connected
              </h2>
              <p className="mb-3 text-center text-sm text-gray-600">
                Your WhatsApp account is successfully linked to this device.
              </p>
            </>
          ) : (
            <>
              <h2 className="mb-1 text-center text-xl font-medium text-gray-800">
                Login to WhatsApp
              </h2>
              <p className="mb-3 text-center text-sm text-gray-600">
                Scan this QR code to link an existing WhatsApp account with this device.
                <a href="#" className="block text-center hover:underline text-xs mt-0.5" style={{ color: '#25D366' }}>
                  Learn more
                </a>
              </p>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="mx-6 mb-4 mt-2 rounded-md bg-gray-50 p-3">
          {qrData?.connected ? (
            <div className="text-sm text-gray-700">
              <p className="mb-2">Your WhatsApp account is already connected to this device. You can:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Start sending and receiving messages</li>
                <li>Access your chats from the sidebar</li>
                <li>Close this window and continue using the application</li>
              </ul>
              <div className="mt-3 flex justify-center">
                <button 
                  onClick={onClose}
                  className="rounded-md px-4 py-2 text-sm text-white hover:opacity-90"
                  style={{ background: gradients.primary.background }}
                >
                  Continue to WhatsApp
                </button>
              </div>
            </div>
          ) : (
            <ol className="space-y-1.5 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="font-bold">1.</span>
                <span className="flex items-center">
                  Open 
                  <span className="inline-flex items-center mx-1 text-white rounded px-1 text-xs" style={{ background: gradients.primary.background }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 mr-0.5">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771z"/>
                    </svg>
                    WhatsApp
                  </span> 
                  on your phone
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">2.</span>
                <span>
                  Tap <strong>Settings</strong> <span className="inline-block rounded-full bg-gray-200 px-1 text-center text-xs">⚙️</span> on iPhone, or <strong>Menu</strong> <span className="inline-block rounded-full bg-gray-200 px-1 text-center text-xs">⋮</span> on Android
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">3.</span>
                <span>
                  Tap <strong>Linked devices</strong> and then <strong>Link a device</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">4.</span>
                <span>
                  Point your phone at this screen to scan the QR code
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">5.</span>
                <span>
                  Keep both apps open and connected to the internet (Wi-Fi, 4G or faster) while your chats load.
                </span>
              </li>
            </ol>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal; 