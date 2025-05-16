import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaMoon, FaSun, FaQrcode } from 'react-icons/fa';
import LoginForm from './LoginForm';

const Login: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { darkMode } = useTheme();
  const [showQrCode, setShowQrCode] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }
  
  // QR Code component is preserved but hidden by default as requested
  if (showQrCode) {
    return <QrCodeLogin onSwitchToForm={() => setShowQrCode(false)} />;
  }
  
  return (
    <div className="bg-gray-50">
      <LoginForm />
      {/* QR Code button removed as requested */}
    </div>
  );
};

// This preserves the original QR code login functionality
const QrCodeLogin: React.FC<{ onSwitchToForm: () => void }> = ({ onSwitchToForm }) => {
  const { loginWithQR, loading, error } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [qrReady, setQrReady] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  React.useEffect(() => {
    // Simulate QR code loading
    const timer = setTimeout(() => {
      setQrReady(true);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleQrClick = async () => {
    setIsScanning(true);
    try {
      await loginWithQR();
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className={`flex min-h-screen flex-col bg-whatsapp-light-bg ${darkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className="bg-whatsapp-teal p-4 dark:bg-gray-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px">
              <path fill="#fff" d="M4.868,43.303l2.694-9.835C5.9,30.59,5.026,27.324,5.027,23.979C5.032,13.514,13.548,5,24.014,5c5.079,0.002,9.845,1.979,13.43,5.566c3.584,3.588,5.558,8.356,5.556,13.428c-0.004,10.465-8.522,18.98-18.986,18.98c-0.001,0,0,0,0,0h-0.008c-3.177-0.001-6.3-0.798-9.073-2.311L4.868,43.303z"/>
              <path fill="#fff" d="M4.868,43.803c-0.132,0-0.26-0.052-0.355-0.148c-0.125-0.127-0.174-0.312-0.127-0.483l2.639-9.636c-1.636-2.906-2.499-6.206-2.497-9.556C4.532,13.238,13.273,4.5,24.014,4.5c5.21,0.002,10.105,2.031,13.784,5.713c3.679,3.683,5.704,8.577,5.702,13.781c-0.004,10.741-8.746,19.48-19.486,19.48c-3.189-0.001-6.344-0.788-9.144-2.277l-9.875,2.589C4.953,43.798,4.911,43.803,4.868,43.803z"/>
              <path fill="#cfd8dc" d="M24.014,5c5.079,0.002,9.845,1.979,13.43,5.566c3.584,3.588,5.558,8.356,5.556,13.428c-0.004,10.465-8.522,18.98-18.986,18.98h-0.008c-3.177-0.001-6.3-0.798-9.073-2.311L4.868,43.303l2.694-9.835C5.9,30.59,5.026,27.324,5.027,23.979C5.032,13.514,13.548,5,24.014,5 M24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974 M24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974 M24.014,4C24.014,4,24.014,4,24.014,4C12.998,4,4.032,12.962,4.027,23.979c-0.001,3.367,0.849,6.685,2.461,9.622l-2.585,9.439c-0.094,0.345,0.002,0.713,0.254,0.967c0.19,0.192,0.447,0.297,0.711,0.297c0.085,0,0.17-0.011,0.254-0.033l9.687-2.54c2.828,1.468,5.998,2.243,9.197,2.244c11.024,0,19.99-8.963,19.995-19.98c0.002-5.339-2.075-10.359-5.848-14.135C34.378,6.083,29.357,4.002,24.014,4L24.014,4z"/>
              <path fill="#40c351" d="M35.176,12.832c-2.98-2.982-6.941-4.625-11.157-4.626c-8.704,0-15.783,7.076-15.787,15.774c-0.001,2.981,0.833,5.883,2.413,8.396l0.376,0.597l-1.595,5.821l5.973-1.566l0.577,0.342c2.422,1.438,5.2,2.198,8.032,2.199h0.006c8.698,0,15.777-7.077,15.78-15.776C39.795,19.778,38.156,15.814,35.176,12.832z"/>
              <path fill="#fff" fillRule="evenodd" d="M19.268,16.045c-0.355-0.79-0.729-0.806-1.068-0.82c-0.277-0.012-0.593-0.011-0.909-0.011c-0.316,0-0.83,0.119-1.265,0.594c-0.435,0.475-1.661,1.622-1.661,3.956c0,2.334,1.7,4.59,1.937,4.906c0.237,0.316,3.282,5.259,8.104,7.161c4.007,1.58,4.823,1.266,5.693,1.187c0.87-0.079,2.807-1.147,3.202-2.255c0.395-1.108,0.395-2.057,0.277-2.255c-0.119-0.198-0.435-0.316-0.909-0.554s-2.807-1.385-3.242-1.543c-0.435-0.158-0.751-0.237-1.068,0.238c-0.316,0.474-1.225,1.543-1.502,1.859c-0.277,0.317-0.554,0.357-1.028,0.119c-0.474-0.238-2.002-0.738-3.815-2.354c-1.41-1.257-2.362-2.81-2.639-3.285c-0.277-0.474-0.03-0.731,0.208-0.968c0.213-0.213,0.474-0.554,0.712-0.831c0.237-0.277,0.316-0.475,0.474-0.791c0.158-0.317,0.079-0.594-0.04-0.831C20.612,19.329,19.69,16.983,19.268,16.045z" clipRule="evenodd"/>
            </svg>
            <h1 className="text-xl font-bold text-white">WhatsApp Web</h1>
          </div>
          <button 
            onClick={toggleDarkMode} 
            className="rounded-full p-2 text-white transition hover:bg-white/10"
          >
            {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col items-center justify-center p-4 dark:bg-gray-900">
        <div className="max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-800 dark:text-white">
            Use WhatsApp on your computer
          </h2>
          
          <div className="mb-6 space-y-4 text-center text-gray-600 dark:text-gray-300">
            <p>1. Open WhatsApp on your phone</p>
            <p>2. Tap Menu or Settings and select WhatsApp Web</p>
            <p>3. Point your phone to this screen to scan the QR code</p>
          </div>
          
          <div className="flex justify-center">
            {loading || !qrReady ? (
              <div className="h-64 w-64 animate-pulse bg-gray-200 dark:bg-gray-700"></div>
            ) : (
              <div 
                className="relative flex h-64 w-64 cursor-pointer items-center justify-center border-4 border-gray-300 dark:border-gray-600"
                onClick={handleQrClick}
              >
                {/* Simulated QR code */}
                <svg 
                  viewBox="0 0 29 29" 
                  height="256" 
                  width="256"
                  className="relative z-10"
                >
                  <path 
                    fill="currentColor" 
                    d="M1,1h7v7h-7zM21,1h7v7h-7zM1,21h7v7h-7z"
                    className="dark:text-white text-gray-800"
                  />
                  <path 
                    fill="currentColor" 
                    d="M3,3h3v3h-3zM23,3h3v3h-3zM3,23h3v3h-3z"
                    className="text-white dark:text-gray-800"
                  />
                  <path 
                    fill="currentColor" 
                    d="M10,1h1v1h-1zM12,1h3v1h-3zM16,1h3v1h-3zM11,2h1v1h-1zM14,2h1v1h-1zM18,2h1v1h-1zM10,3h1v1h-1zM12,3h1v1h-1zM16,3h1v1h-1zM18,3h1v1h-1zM13,4h3v1h-3zM10,5h1v1h-1zM12,5h1v1h-1zM14,5h1v1h-1zM16,5h3v1h-3zM10,6h3v1h-3zM15,6h3v1h-3zM10,7h1v1h-1zM13,7h2v1h-2zM17,7h3v1h-3zM1,9h3v1h-3zM5,9h2v1h-2zM8,9h2v1h-2zM13,9h1v1h-1zM15,9h2v1h-2zM19,9h1v1h-1zM22,9h2v1h-2zM25,9h1v1h-1zM27,9h1v1h-1zM1,10h1v1h-1zM3,10h1v1h-1zM8,10h3v1h-3zM12,10h1v1h-1zM14,10h3v1h-3zM21,10h1v1h-1zM23,10h1v1h-1zM26,10h1v1h-1zM2,11h1v1h-1zM7,11h2v1h-2zM10,11h2v1h-2zM13,11h1v1h-1zM15,11h1v1h-1zM19,11h1v1h-1zM21,11h1v1h-1zM26,11h2v1h-2zM1,12h1v1h-1zM5,12h2v1h-2zM9,12h2v1h-2zM13,12h1v1h-1zM15,12h1v1h-1zM17,12h1v1h-1zM19,12h1v1h-1zM21,12h1v1h-1zM23,12h1v1h-1zM25,12h1v1h-1zM27,12h1v1h-1zM1,13h2v1h-2zM4,13h1v1h-1zM6,13h3v1h-3zM10,13h1v1h-1zM12,13h2v1h-2zM16,13h1v1h-1zM18,13h2v1h-2zM22,13h1v1h-1zM24,13h1v1h-1zM26,13h1v1h-1zM1,14h2v1h-2zM4,14h1v1h-1zM7,14h1v1h-1zM9,14h1v1h-1zM12,14h2v1h-2zM15,14h1v1h-1zM19,14h3v1h-3zM24,14h2v1h-2zM1,15h2v1h-2zM4,15h1v1h-1zM6,15h1v1h-1zM10,15h1v1h-1zM12,15h1v1h-1zM14,15h1v1h-1zM17,15h1v1h-1zM22,15h1v1h-1zM24,15h1v1h-1zM26,15h2v1h-2zM1,16h1v1h-1zM3,16h1v1h-1zM6,16h1v1h-1zM9,16h1v1h-1zM11,16h1v1h-1zM13,16h2v1h-2zM16,16h1v1h-1zM20,16h2v1h-2zM23,16h2v1h-2zM26,16h1v1h-1zM1,17h3v1h-3zM7,17h1v1h-1zM9,17h2v1h-2zM12,17h1v1h-1zM14,17h1v1h-1zM16,17h1v1h-1zM18,17h1v1h-1zM21,17h1v1h-1zM23,17h4v1h-4zM10,18h1v1h-1zM14,18h2v1h-2zM18,18h1v1h-1zM21,18h3v1h-3zM25,18h1v1h-1zM27,18h1v1h-1zM1,19h7v1h-7zM10,19h2v1h-2zM15,19h2v1h-2zM20,19h2v1h-2zM25,19h1v1h-1zM27,19h1v1h-1zM1,20h1v1h-1zM7,20h1v1h-1zM12,20h2v1h-2zM15,20h2v1h-2zM19,20h1v1h-1zM23,20h2v1h-2zM26,20h1v1h-1zM1,21h1v1h-1zM3,21h3v1h-3zM7,21h1v1h-1zM10,21h1v1h-1zM12,21h1v1h-1zM14,21h2v1h-2zM17,21h1v1h-1zM19,21h1v1h-1zM21,21h1v1h-1zM24,21h1v1h-1zM26,21h1v1h-1zM1,22h1v1h-1zM3,22h3v1h-3zM7,22h1v1h-1zM9,22h1v1h-1zM12,22h2v1h-2zM15,22h1v1h-1zM17,22h1v1h-1zM19,22h1v1h-1zM21,22h1v1h-1zM27,22h1v1h-1zM1,23h1v1h-1zM3,23h3v1h-3zM7,23h1v1h-1zM9,23h1v1h-1zM11,23h2v1h-2zM14,23h2v1h-2zM18,23h3v1h-3zM22,23h1v1h-1zM24,23h1v1h-1zM26,23h1v1h-1zM1,24h1v1h-1zM7,24h1v1h-1zM9,24h1v1h-1zM13,24h2v1h-2zM16,24h1v1h-1zM18,24h7v1h-7zM26,24h1v1h-1zM1,25h7v1h-7zM9,25h1v1h-1zM11,25h1v1h-1zM15,25h1v1h-1zM17,25h2v1h-2zM20,25h3v1h-3zM25,25h2v1h-2zM9,26h3v1h-3zM13,26h6v1h-6zM21,26h1v1h-1zM23,26h1v1h-1zM25,26h1v1h-1zM27,26h1v1h-1zM10,27h1v1h-1zM13,27h5v1h-5zM20,27h2v1h-2zM23,27h2v1h-2zM27,27h1v1h-1z"
                    className="dark:text-white text-gray-800"
                  />
                </svg>
                
                {/* Scan overlay animation */}
                {isScanning && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center">
                    <div className="h-full w-1 animate-scan bg-whatsapp-light-green"></div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {error && (
            <div className="mt-4 rounded-md bg-red-100 p-3 text-center text-red-600 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}
          
          <div className="mt-6 flex justify-between">
            <button 
              onClick={onSwitchToForm}
              className="text-whatsapp-teal hover:underline dark:text-whatsapp-light-green"
            >
              Login with email instead
            </button>
            
            <a href="#" className="text-whatsapp-teal hover:underline dark:text-whatsapp-light-green">
              Need help?
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white p-4 text-center text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        <p>© 2023 WhatsApp LLC</p>
      </footer>
    </div>
  );
};

export default Login; 