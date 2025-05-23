import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { gradients, colors } from '../styles/theme';

// Country codes data
const countryCodes = [
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+970', country: 'Palestine', flag: '🇵🇸' },
  { code: '+1', country: 'United States', flag: '🇺🇸' },
  { code: '+1', country: 'Canada', flag: '🇨🇦' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
];

// Phone number length by country code
const phoneNumberLengths = {
  '+92': 10, // Pakistan
  '+1': 10,  // US
  '+44': 10, // UK
  '+91': 10, // India
  '+86': 11, // China
  '+971': 9, // UAE
  '+966': 9, // Saudi Arabia
  '+61': 9,  // Australia
  '+49': 11, // Germany
  '+33': 9,  // France
};

// API endpoints
const API_ENDPOINTS = {
  REQUEST_OTP: 'https://v3-wabi.cloudious.net/api/Users/UserSignupOTP',
  VERIFY_OTP: 'https://v3-wabi.cloudious.net/api/Users/LoginWithOTP'
};

// Cooldown times in seconds for resend OTP
const RESEND_COOLDOWNS = [59, 120, 300, 600];

const Login: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const { darkMode } = useTheme();
  const [loginMethod, setLoginMethod] = useState<'password' | 'phone'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('+92');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [touched, setTouched] = useState(false);
  
  // New state variables for OTP flow
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [resendCount, setResendCount] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  
  // Countdown timer for resend
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    
    if (resendCooldown > 0) {
      timerId = setTimeout(() => {
        setResendCooldown(prevCooldown => prevCooldown - 1);
      }, 1000);
    }
    
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [resendCooldown]);

  // Validate phone number when it changes
  useEffect(() => {
    validatePhoneNumber(phoneNumber);
  }, [phoneNumber, selectedCountryCode]);

  // Auto-focus phone input on component mount
  useEffect(() => {
    if (phoneInputRef.current && !showOtpScreen) {
      phoneInputRef.current.focus();
    }
  }, [showOtpScreen]);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }
  
  const handleRequestOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!isValid || isLoading) return;
    
    setIsLoading(true);
    setApiError('');
    
    try {
      const response = await fetch(API_ENDPOINTS.REQUEST_OTP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          countryCode: selectedCountryCode,
          number: phoneNumber
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send verification code');
      }
      
      // Set cooldown for resend
      setResendCooldown(RESEND_COOLDOWNS[resendCount]);
      
      // If it's first request, show OTP screen
      if (!showOtpScreen) {
        setShowOtpScreen(true);
        // Focus the first OTP input box
        setTimeout(() => {
          if (otpInputRefs.current[0]) {
            otpInputRefs.current[0].focus();
          }
        }, 100);
      }
      
    } catch (error) {
      console.error('Error requesting OTP:', error);
      setApiError(error instanceof Error ? error.message : 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResendOTP = () => {
    // Only allow resend if cooldown is finished
    if (resendCooldown === 0) {
      // Increment resend count (max 3 for the cooldown array)
      setResendCount(prevCount => Math.min(prevCount + 1, RESEND_COOLDOWNS.length - 1));
      
      // Re-trigger OTP request
      handleRequestOTP();
    }
  };
  
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const otpCode = otpValues.join('');
    
    // Check if OTP is complete
    if (otpCode.length !== 4 || isLoading) return;
    
    setIsLoading(true);
    setApiError('');
    
    try {
      const response = await fetch(API_ENDPOINTS.VERIFY_OTP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          number: selectedCountryCode + phoneNumber,
          otp: otpCode
        })
      });
      
      const data = await response.json();
      
      if (!response.ok || data.status === "error") {
        // Handle API error
        throw new Error(data.message || 'Failed to verify code');
      }
      
      // Handle successful verification
      // Save data to localStorage directly (for compatibility with existing code)
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.data));
      
      // Authenticate the user through the context
      await login({
        token: data.token,
        user: data.data
      });
      
      // Context will automatically redirect to "/" after successful authentication
      
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setApiError(error instanceof Error ? error.message : 'Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOtpChange = (index: number, value: string) => {
    // Allow only digits
    if (!/^\d*$/.test(value)) return;
    
    // Update OTP array
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);
    
    // Auto-focus next input if value is entered
    if (value && index < otpValues.length - 1) {
      const nextInput = otpInputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }
  };
  
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace - focus previous input when current is empty
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      const prevInput = otpInputRefs.current[index - 1];
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const validatePhoneNumber = (number: string) => {
    // Remove any non-digit characters
    const digitsOnly = number.replace(/\D/g, '');
    
    // Get expected length for selected country
    const expectedLength = phoneNumberLengths[selectedCountryCode as keyof typeof phoneNumberLengths] || 10;
    
    if (digitsOnly.length === 0) {
      setErrorMessage('Please enter your WhatsApp number');
      setIsValid(false);
    } else if (digitsOnly.length !== expectedLength) {
      setErrorMessage(`WhatsApp number should be ${expectedLength} digits for ${selectedCountryCode}`);
      setIsValid(false);
    } else {
      setErrorMessage('');
      setIsValid(true);
    }
    
    return digitsOnly.length === expectedLength;
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Set touched to true on first interaction
    if (!touched) {
      setTouched(true);
    }
    
    const input = e.target.value;
    // Allow only numbers and formatting characters
    let filtered = input.replace(/[^\d\s-+()]/g, '');
    
    // Remove leading zero if country code is +92 (Pakistan)
    if (selectedCountryCode === '+92' && filtered.startsWith('0')) {
      filtered = filtered.substring(1);
    }
    
    // Get expected length for selected country
    const expectedLength = phoneNumberLengths[selectedCountryCode as keyof typeof phoneNumberLengths] || 10;
    
    // Limit input to expected length
    if (filtered.length > expectedLength) {
      filtered = filtered.substring(0, expectedLength);
    }
    
    setPhoneNumber(filtered);
  };
  
  // Generate the resend code text with timer
  const getResendCodeText = () => {
    if (resendCooldown === 0) {
      return (
        <>
          Didn't receive the code? <button 
            type="button" 
            onClick={handleResendOTP}
            className="font-medium hover:underline"
            style={{ color: colors.whatsappLight }}
          >
            Resend code
          </button>
        </>
      );
    } else {
      // Format time as MM:SS
      const minutes = Math.floor(resendCooldown / 60);
      const seconds = resendCooldown % 60;
      const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      return (
        <>
          Resend code available in <span className="text-gray-700 font-medium">{formattedTime}</span>
        </>
      );
    }
  };
  
  const handleGoBack = () => {
    setShowOtpScreen(false);
    // Reset OTP values
    setOtpValues(['', '', '', '']);
    // Reset any API errors
    setApiError('');
    
    // Focus phone input when going back
    setTimeout(() => {
      if (phoneInputRef.current) {
        phoneInputRef.current.focus();
      }
    }, 100);
  };
  
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left section with images and text */}
      <div className="relative hidden md:flex md:w-1/2 md:flex-col md:justify-between overflow-hidden">
        {/* Background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0" 
          style={{ backgroundImage: 'url(/bg.jpeg)' }}
        ></div>
        
        {/* Overlay for better text visibility */}
        <div className="absolute inset-0 bg-black bg-opacity-40 z-10"></div>
      </div>
      
      {/* Right section with login form */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 md:w-1/2">
        <div className="w-full max-w-md mobile-center">
          {/* Logo and title */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <svg width="80" height="80" viewBox="0 0 122.88 122.31" className="mobile-touch-target">
                <defs>
                  <linearGradient id="whatsapp-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#25D366" />
                    <stop offset="100%" stopColor="#128C7E" />
                  </linearGradient>
                </defs>
                <path fill="url(#whatsapp-gradient)" d="M27.75,0H95.13a27.83,27.83,0,0,1,27.75,27.75V94.57a27.83,27.83,0,0,1-27.75,27.74H27.75A27.83,27.83,0,0,1,0,94.57V27.75A27.83,27.83,0,0,1,27.75,0Z"/>
                <path fill="#fff" d="M61.44,25.39A35.76,35.76,0,0,0,31.18,80.18L27.74,94.86l14.67-3.44a35.77,35.77,0,1,0,19-66ZM41,95.47,35.1,96.85l.94,4,4.35-1a43.36,43.36,0,0,0,10.46,4l1-4A40,40,0,0,1,41,95.45l0,0ZM21.76,86.53l4,.93,1.37-5.91a39.6,39.6,0,0,1-4.43-10.82l-4,1a44.23,44.23,0,0,0,4.06,10.46l-1,4.35Zm9.68,11.15-8.52,2,2-8.52-4-.93-2,8.51a4.12,4.12,0,0,0,3.08,5,4,4,0,0,0,1.88,0l8.52-2-.94-4.06Zm24-76a40.56,40.56,0,0,1,12,0L68,17.63a44.25,44.25,0,0,0-13.2,0l.63,4.07ZM99.14,38.4l-3.53,2.12a39.89,39.89,0,0,1,4.57,11l4-1a43.75,43.75,0,0,0-5-12.18Zm-69.81-.91A40.29,40.29,0,0,1,37.78,29l-2.47-3.32A43.62,43.62,0,0,0,26,35l3.32,2.47ZM85.1,29a40.11,40.11,0,0,1,8.46,8.45L96.88,35a43.62,43.62,0,0,0-9.3-9.3L85.1,29Zm8.46,55.78a40.11,40.11,0,0,1-8.46,8.45l2.45,3.32a44,44,0,0,0,9.33-9.3l-3.32-2.47ZM67.42,100.6a39.89,39.89,0,0,1-12,0l-.62,4.09a44.18,44.18,0,0,0,13.19,0l-.62-4.09Zm36.76-28.88-4-1A40,40,0,0,1,95.6,81.8l3.53,2.12a43.72,43.72,0,0,0,5.05-12.2Zm-2.84-10.57a39.93,39.93,0,0,1-.45,6l4.07.62a44.18,44.18,0,0,0,0-13.19l-4.07.62a39.8,39.8,0,0,1,.45,6ZM84.2,98.85l-2.12-3.53a39.89,39.89,0,0,1-11,4.57l1,4a43.75,43.75,0,0,0,12.18-5ZM21.55,61.15a41.15,41.15,0,0,1,.44-6l-4.07-.62a44.18,44.18,0,0,0,0,13.19L22,67.13a41.28,41.28,0,0,1-.44-6Zm2.2-22.75A43.83,43.83,0,0,0,18.7,50.59l4,1a40.08,40.08,0,0,1,4.57-11.06L23.75,38.4ZM72,18.41l-1,4A40.08,40.08,0,0,1,82.08,27l2.13-3.53A44,44,0,0,0,72,18.41Zm-21.13,0,1,4A40.08,40.08,0,0,0,40.8,27l-2.12-3.53a44,44,0,0,1,12.2-5.05Z"/>
              </svg>
            </div>
            <span className="text-3xl font-bold mobile-text-xl" style={{ fontFamily: "'Mabry Pro', sans-serif" }}>WABI</span>
            
            {/* Horizontal separator line */}
            {showOtpScreen && (
              <div className="w-full h-px bg-gray-200 my-6"></div>
            )}
          </div>
          
          <form onSubmit={showOtpScreen ? handleVerifyOTP : handleRequestOTP} className="mobile-center">
            {/* API Error message */}
            {apiError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-center">
                {apiError}
              </div>
            )}
            
            {!showOtpScreen ? (
              // Phone number input screen
              <div className="mb-6">
                <div className="relative">
                  {/* Country code dropdown and phone input in single row */}
                  <div className="flex mobile-stack">
                    {/* Country code selector */}
                    <div className="relative mb-0 md:mb-0 mobile-center">
                      <div 
                        className="flex items-center justify-center h-12 px-3 border border-r-0 md:border-r-0 border-gray-300 rounded-md md:rounded-l-md md:rounded-r-none bg-white cursor-pointer mobile-full-width mobile-touch-target"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                      >
                        <span className="text-xl mr-2">
                          {countryCodes.find(c => c.code === selectedCountryCode)?.flag}
                        </span>
                        <span className="font-medium">{selectedCountryCode}</span>
                        <svg 
                          className={`w-4 h-4 ml-2 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24" 
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                      
                      {/* Dropdown options */}
                      {dropdownOpen && (
                        <div className="absolute z-10 w-64 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {countryCodes.map((country) => (
                            <div 
                              key={country.code}
                              className={`flex items-center p-2 cursor-pointer hover:bg-gray-100 ${selectedCountryCode === country.code ? 'bg-gray-100' : ''}`}
                              onClick={() => {
                                setSelectedCountryCode(country.code);
                                setDropdownOpen(false);
                                // Check if we need to remove leading zero when switching to Pakistan
                                if (country.code === '+92' && phoneNumber.startsWith('0')) {
                                  setPhoneNumber(phoneNumber.substring(1));
                                }
                                validatePhoneNumber(phoneNumber);
                                
                                // Set focus back to phone input after country selection
                                setTimeout(() => {
                                  if (phoneInputRef.current) {
                                    phoneInputRef.current.focus();
                                  }
                                }, 10);
                              }}
                            >
                              <span className="text-xl mr-2">{country.flag}</span>
                              <span className="font-medium">{country.code}</span>
                              <span className="ml-2 text-gray-600 text-sm">{country.country}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Phone number input */}
                    <input
                      ref={phoneInputRef}
                      type="tel"
                      className="flex-1 p-3 h-12 border border-gray-300 rounded-md md:rounded-l-none md:rounded-r-md focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 mobile-full-width mobile-touch-target mt-3 md:mt-0"
                      placeholder="Enter your WhatsApp number"
                      value={phoneNumber}
                      onChange={handlePhoneNumberChange}
                      maxLength={phoneNumberLengths[selectedCountryCode as keyof typeof phoneNumberLengths] || 10}
                      disabled={isLoading}
                    />
                  </div>
                  
                  {/* Error message - only show if touched */}
                  {touched && errorMessage && (
                    <p className="mt-1 text-sm text-red-600 text-center">{errorMessage}</p>
                  )}
                </div>
              </div>
            ) : (
              // OTP input screen
              <div className="mb-6">
                <div className="flex justify-center gap-2 mb-4">
                  {otpValues.map((value, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpInputRefs.current[index] = el; }}
                      type="text"
                      className={`w-14 h-14 text-center text-xl font-bold border mobile-touch-target ${
                        value ? 'border-gray-300' : index === otpValues.findIndex(v => !v) ? 'border-green-500 border-2' : 'border-gray-300'
                      } rounded-md focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500`}
                      value={value}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      maxLength={1}
                      disabled={isLoading}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Submit button */}
            <button
              type="submit"
              className={`w-full h-12 p-3 rounded-md text-white font-medium flex items-center justify-center mobile-touch-target ${(!isValid && !showOtpScreen) || isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'}`}
              style={{ background: gradients.primary.background }}
              disabled={((!isValid && !showOtpScreen) || isLoading)}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {showOtpScreen ? 'Verifying...' : 'Sending...'}
                </>
              ) : (
                showOtpScreen ? 'Verify code' : 'Continue with WhatsApp'
              )}
            </button>
            
            {/* Additional info / Resend code */}
            <p className="mt-4 text-sm text-center text-gray-600">
              {showOtpScreen ? getResendCodeText() : "We'll send a code to verify your WhatsApp number"}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login; 