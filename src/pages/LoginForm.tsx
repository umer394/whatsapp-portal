import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LoginForm: React.FC = () => {
  const { isAuthenticated, login, error } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login({
        email: formData.email,
        password: formData.password
      });
      
      if (result.success) {
        toast.success('Login successful!');
        // Redirect to main page after successful login
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        toast.error(result.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      toast.error('An error occurred during login. Please try again.');
      console.error('Login error:', error);
      
    } finally {
      setLoading(false);
    }
  };

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
        <div className={`w-full max-w-md rounded-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} p-5 shadow-md`}>
          <div className="mb-5 flex border-b">
            <Link to="/register" className={`w-1/2 pb-3 text-center font-medium ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
              Register
            </Link>
            <button className="w-1/2 border-b-2 border-green-500 pb-3 text-center font-medium text-green-500">
              Login
            </button>
          </div>
          
          <div className="mb-4 flex justify-center">
            <div className="h-12 w-12 rounded-full bg-green-500 p-2 text-white">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="currentColor"/>
              </svg>
            </div>
          </div>
          
          <h2 className={`mb-4 text-center text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Login to Your Account
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="email" className={`mb-1 block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Username or Email
              </label>
              <input
                type="text"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`w-full rounded-md border ${darkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 text-gray-800 placeholder-gray-400'} p-2.5 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500`}
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className={`mb-1 block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Your Password"
                  className={`w-full rounded-md border ${darkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 text-gray-800 placeholder-gray-400'} p-2.5 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
            </div>
            
            {error && (
              <div className={`mb-4 rounded-md ${darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600'} p-3 text-center`}>
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-md bg-green-500 p-2.5 text-center font-medium text-white ${loading ? 'cursor-not-allowed opacity-70' : 'hover:bg-green-600'} focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2`}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginForm; 