import React, { useState, useRef, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Maximum length of phone numbers by country code
const phoneMaxLengths: Record<string, number> = {
  '+1': 10,   // USA
  '+971': 9,   // UAE
  '+44': 10,  // UK
  '+91': 10,  // India
  '+92': 10,  // Pakistan
  '+55': 11,  // Brazil
  '+61': 9,   // Australia
  '+93': 9,   // Afghanistan
  '+358': 9,  // Finland
  '+355': 9,  // Albania
  '+213': 9,  // Algeria
};

// Default max length if not in the map
const DEFAULT_MAX_LENGTH = 10;

const Register: React.FC = () => {
  const { isAuthenticated, register } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    whatsappNumber: ''
  });
  
  const [selectedCountry, setSelectedCountry] = useState({
    code: '+92',
    flag: 'pk',
    name: 'Pakistan'
  });
  
  const countries = [
    { code: '+93', flag: 'af', name: 'Afghanistan' },
    { code: '+358', flag: 'ax', name: 'Åland Islands' },
    { code: '+355', flag: 'al', name: 'Albania' },
    { code: '+213', flag: 'dz', name: 'Algeria' },
    { code: '+55', flag: 'br', name: 'Brazil' },
    { code: '+1', flag: 'us', name: 'United States' },
    { code: '+44', flag: 'gb', name: 'United Kingdom' },
    { code: '+91', flag: 'in', name: 'India' },
    { code: '+92', flag: 'pk', name: 'Pakistan' },
    { code: '+61', flag: 'au', name: 'Australia' }
  ];
  
  const filteredCountries = searchQuery 
    ? countries.filter(country => 
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        country.code.includes(searchQuery))
    : countries;
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'whatsappNumber') {
      // Only allow digits
      const digitsOnly = value.replace(/\D/g, '');
      
      // Get max length for the selected country code
      const maxLength = phoneMaxLengths[selectedCountry.code] || DEFAULT_MAX_LENGTH;
      
      // Limit the length based on the country code
      const limitedValue = digitsOnly.slice(0, maxLength);
      
      setFormData(prev => ({
        ...prev,
        [name]: limitedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCountrySelect = (country: typeof selectedCountry) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
    setSearchQuery('');
    
    // Clear the whatsapp number when country changes to enforce new validation
    setFormData(prev => ({
      ...prev,
      whatsappNumber: ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        countryCode: selectedCountry.code,
        whatsappNumber: formData.whatsappNumber
      });
      
      if (result.success) {
        toast.success('Registration successful!');
        // Redirect to main page after successful registration
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        toast.error(result.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      toast.error('An error occurred during registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-4">
        <div className={`w-full rounded-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} p-5 shadow-md`}>
          {/* Tabs */}
          <div className="mb-5 flex border-b">
            <button className="w-1/2 border-b-2 border-green-500 pb-3 text-center font-semibold text-green-500">
              Register
            </button>
            <Link to="/login" className={`w-1/2 pb-3 text-center font-medium ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
              Login
            </Link>
          </div>
          
          {/* Icon */}
          <div className="mb-4 flex justify-center">
            <div className="h-12 w-12 rounded-full bg-green-500 p-2 text-white">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="currentColor"/>
              </svg>
            </div>
          </div>
          
          {/* Heading */}
          <h2 className={`mb-4 text-center text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Create your Account
          </h2>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="name" className={`mb-1 block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your Full Name"
                className={`w-full rounded-md border ${darkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 text-gray-800 placeholder-gray-400'} p-2.5 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500`}
                required
              />
            </div>
            
            <div>
              <label htmlFor="email" className={`mb-1 block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Email
              </label>
              <input
                type="email"
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
                  placeholder="Min. 6 characters"
                  className={`w-full rounded-md border ${darkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 text-gray-800 placeholder-gray-400'} p-2.5 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500`}
                  minLength={6}
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
            
            <div>
              <label htmlFor="whatsappNumber" className={`mb-1 block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                WhatsApp Number
              </label>
              <div className="flex">
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className={`flex h-10 items-center justify-between rounded-l-md border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} border-r-0 px-3`}
                    style={{ minWidth: '90px' }}
                  >
                    <span className="flex items-center text-gray-600">
                      <img 
                        src={`https://flagcdn.com/w20/${selectedCountry.flag}.png`} 
                        alt={selectedCountry.name} 
                        className="mr-2 inline-block h-4 w-6" 
                      />
                      <span className={`mr-1 ${darkMode ? 'text-white' : ''}`}>{selectedCountry.code}</span>
                    </span>
                    <svg className={`h-4 w-4 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  
                  {showCountryDropdown && (
                    <div className={`absolute left-0 z-10 mt-1 w-80 rounded-md border ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'} shadow-lg`}>
                      <div className={`p-2 ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <svg className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                            </svg>
                          </div>
                          <input 
                            type="text" 
                            className={`w-full p-2 pl-10 text-sm border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500`} 
                            placeholder="Country or code"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="max-h-52 overflow-y-auto">
                        {filteredCountries.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => handleCountrySelect(country)}
                            className={`flex w-full items-center px-4 py-3 text-left ${darkMode ? 'hover:bg-gray-700 border-b border-gray-700' : 'hover:bg-gray-100 border-b border-gray-100'}`}
                          >
                            <img 
                              src={`https://flagcdn.com/w20/${country.flag}.png`} 
                              alt={country.name} 
                              className="mr-3 inline-block h-4 w-6" 
                            />
                            <span className={`font-medium mr-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>{country.code}</span>
                            <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{country.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <input
                  type="tel"
                  id="whatsappNumber"
                  name="whatsappNumber"
                  value={formData.whatsappNumber}
                  onChange={handleChange}
                  placeholder={`${phoneMaxLengths[selectedCountry.code] || DEFAULT_MAX_LENGTH} digits max`}
                  className={`h-10 w-full flex-1 rounded-r-md border ${darkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 text-gray-800 placeholder-gray-400'} px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500`}
                  required
                  maxLength={phoneMaxLengths[selectedCountry.code] || DEFAULT_MAX_LENGTH}
                />
              </div>
              <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Enter only digits without spaces or dashes.
              </p>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full rounded-md bg-green-500 p-2.5 text-center font-medium text-white ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-green-600'} focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2`}
            >
              {isSubmitting ? 'Registering...' : 'Register'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register; 