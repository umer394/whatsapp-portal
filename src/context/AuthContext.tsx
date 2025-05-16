import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { AuthState, User, WhatsAppProfile } from '../types';
import mockUsers from '../data/mockUsers';

interface AuthContextType extends AuthState {
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; message: string }>;
  loginWithQR: (qrCode?: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    countryCode: string;
    whatsappNumber: string;
  }) => Promise<{
    success: boolean;
    message: string;
  }>;
  checkWhatsAppStatus: () => Promise<boolean>;
  whatsappConnected: boolean;
  whatsappProfile: WhatsAppProfile | null;
  whatsappLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API base URL
const API_BASE_URL = 'https://v3-wabi.cloudious.net/api/';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
  });
  const [whatsappConnected, setWhatsappConnected] = useState<boolean>(false);
  const [whatsappProfile, setWhatsappProfile] = useState<WhatsAppProfile | null>(null);
  const [whatsappLoading, setWhatsappLoading] = useState<boolean>(false);
  const initialStatusCheckDone = useRef(false);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        const user = JSON.parse(storedUser);
        setAuthState({
          isAuthenticated: true,
          user,
          loading: false,
          error: null,
        });
      } catch (error) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: 'Invalid stored user data',
        });
      }
    } else {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Check WhatsApp connection status
  const checkWhatsAppStatus = async (): Promise<boolean> => {
    // Use a stronger throttling mechanism to prevent API spam
    const lastCheckTime = localStorage.getItem('whatsapp_last_check_time');
    const throttleInterval = 10000; // 10 seconds
    
    if (lastCheckTime) {
      const timeSinceLastCheck = Date.now() - parseInt(lastCheckTime);
      
      // If we checked recently and either:
      // 1. We're already connected OR
      // 2. We're still within the throttling window
      // Then return the cached status
      if ((timeSinceLastCheck < throttleInterval && whatsappConnected) || 
          (timeSinceLastCheck < 2000)) { // Hard limit of 2 seconds between any checks
        console.log("Throttled WhatsApp status check - returning cached status");
        return whatsappConnected;
      }
    }

    // Record current check time
    localStorage.setItem('whatsapp_last_check_time', Date.now().toString());
    console.log("Checking WhatsApp status via API...");
    
    setWhatsappLoading(true);
    
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        setWhatsappConnected(false);
        setWhatsappLoading(false);
        return false;
      }
      
      // Check WhatsApp instance status
      const statusResponse = await fetch('https://v3-wabi.cloudious.net/api/WhatsApp/InstanceStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const statusData = await statusResponse.json();
      console.log("WhatsApp status response:", statusData);
      
      if (statusData.state === "CONNECTED") {
        setWhatsappConnected(true);
        
        // Only load profile if we don't already have it or if we were previously disconnected
        if (!whatsappProfile || !whatsappConnected) {
          // Load WhatsApp profile
          const profileResponse = await fetch('https://v3-wabi.cloudious.net/api/WhatsApp/LoadInstanceProfile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          const profileData = await profileResponse.json();
          
          if (profileData.status === "success") {
            // Map the API response to our WhatsAppProfile type
            const profileInfo: WhatsAppProfile = {
              name: profileData.data.name,
              connectionStatus: profileData.data.connectionStatus,
              ownerJid: profileData.data.ownerJid,
              profileName: profileData.data.profileName,
              profilePictureUrl: profileData.data.profilePicUrl,
              // For backward compatibility with existing code
              pushName: profileData.data.profileName,
              phoneNumber: profileData.data.ownerJid.split('@')[0],
              jid: profileData.data.ownerJid
            };
            setWhatsappProfile(profileInfo);
          }
        }
        
        setWhatsappLoading(false);
        return true;
      } else {
        setWhatsappConnected(false);
        setWhatsappLoading(false);
        return false;
      }
    } catch (err) {
      console.error('Error checking WhatsApp status:', err);
      setWhatsappConnected(false);
      setWhatsappLoading(false);
      return false;
    }
  };

  // Register new user
  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    countryCode: string;
    whatsappNumber: string;
  }): Promise<{ success: boolean; message: string }> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch(`${API_BASE_URL}Users/UserSignup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // Save token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.data));
        
        setAuthState({
          isAuthenticated: true,
          user: data.data,
          loading: false,
          error: null,
        });
        
        // Check WhatsApp status after successful registration
        await checkWhatsAppStatus();
        
        return { success: true, message: data.message };
      } else {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: data.message || 'Registration failed',
        }));
        
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      
      return { success: false, message: errorMessage };
    }
  };

  // Login with email and password
  const login = async (credentials: { 
    email: string; 
    password: string 
  }): Promise<{ success: boolean; message: string }> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Map email to username for the API request
      const apiRequest = {
        username: credentials.email, // API expects 'username' field
        password: credentials.password
      };
      
      const response = await fetch(`${API_BASE_URL}Users/SignIn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiRequest),
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // Save token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.data));
        
        setAuthState({
          isAuthenticated: true,
          user: data.data,
          loading: false,
          error: null,
        });
        
        // Check WhatsApp status after successful login
        await checkWhatsAppStatus();
        
        return { success: true, message: data.message };
      } else {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: data.message || 'Login failed',
        }));
        
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      
      return { success: false, message: errorMessage };
    }
  };

  // Simulate login with QR code
  const loginWithQR = async (qrCode?: string): Promise<void> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // In a real app, we would call an API to verify the QR code
      // For demo purposes, we'll simulate a delay and use a mock user
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Use the first mock user
      const user = mockUsers[0];
      
      localStorage.setItem('user', JSON.stringify(user));
      
      setAuthState({
        isAuthenticated: true,
        user,
        loading: false,
        error: null,
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Login failed. Please try again.',
      }));
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
    });
  };

  const updateUser = (userData: Partial<User>) => {
    if (!authState.user) return;
    
    const updatedUser = { ...authState.user, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    setAuthState(prev => ({
      ...prev,
      user: updatedUser,
    }));
  };

  // Check WhatsApp status on initial load if user is authenticated
  useEffect(() => {
    if (authState.isAuthenticated && !authState.loading && !initialStatusCheckDone.current) {
      checkWhatsAppStatus();
      initialStatusCheckDone.current = true;
    }
  }, [authState.isAuthenticated, authState.loading]);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        loginWithQR,
        logout,
        updateUser,
        register,
        checkWhatsAppStatus,
        whatsappConnected,
        whatsappProfile,
        whatsappLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 