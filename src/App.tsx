import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { ToastProvider } from './context/ToastContext';

import Login from './pages/Login';
import Register from './pages/Register';
import Main from './pages/Main';
import ProtectedRoute from './components/ProtectedRoute';
import './fonts/MabryPro-Regular.ttf';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <ToastProvider>
            <div style={{ fontFamily: "'Mabry Pro', sans-serif" }}>
              <Router>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route 
                    path="/" 
                    element={
                      <ProtectedRoute>
                        <Main />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
              </Router>
            </div>
          </ToastProvider>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
