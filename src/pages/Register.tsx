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
  const countryListRef = useRef<HTMLDivElement>(null);
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
  
  const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('bottom');
  
  const countries = [
    { code: '+93', flag: 'af', name: 'Afghanistan' },
    { code: '+355', flag: 'al', name: 'Albania' },
    { code: '+213', flag: 'dz', name: 'Algeria' },
    { code: '+376', flag: 'ad', name: 'Andorra' },
    { code: '+244', flag: 'ao', name: 'Angola' },
    { code: '+1264', flag: 'ai', name: 'Anguilla' },
    { code: '+1268', flag: 'ag', name: 'Antigua and Barbuda' },
    { code: '+54', flag: 'ar', name: 'Argentina' },
    { code: '+374', flag: 'am', name: 'Armenia' },
    { code: '+297', flag: 'aw', name: 'Aruba' },
    { code: '+61', flag: 'au', name: 'Australia' },
    { code: '+43', flag: 'at', name: 'Austria' },
    { code: '+994', flag: 'az', name: 'Azerbaijan' },
    { code: '+1242', flag: 'bs', name: 'Bahamas' },
    { code: '+973', flag: 'bh', name: 'Bahrain' },
    { code: '+880', flag: 'bd', name: 'Bangladesh' },
    { code: '+1246', flag: 'bb', name: 'Barbados' },
    { code: '+375', flag: 'by', name: 'Belarus' },
    { code: '+32', flag: 'be', name: 'Belgium' },
    { code: '+501', flag: 'bz', name: 'Belize' },
    { code: '+229', flag: 'bj', name: 'Benin' },
    { code: '+1441', flag: 'bm', name: 'Bermuda' },
    { code: '+975', flag: 'bt', name: 'Bhutan' },
    { code: '+591', flag: 'bo', name: 'Bolivia' },
    { code: '+387', flag: 'ba', name: 'Bosnia and Herzegovina' },
    { code: '+267', flag: 'bw', name: 'Botswana' },
    { code: '+55', flag: 'br', name: 'Brazil' },
    { code: '+246', flag: 'io', name: 'British Indian Ocean Territory' },
    { code: '+673', flag: 'bn', name: 'Brunei' },
    { code: '+359', flag: 'bg', name: 'Bulgaria' },
    { code: '+226', flag: 'bf', name: 'Burkina Faso' },
    { code: '+257', flag: 'bi', name: 'Burundi' },
    { code: '+855', flag: 'kh', name: 'Cambodia' },
    { code: '+237', flag: 'cm', name: 'Cameroon' },
    { code: '+1', flag: 'ca', name: 'Canada' },
    { code: '+238', flag: 'cv', name: 'Cape Verde' },
    { code: '+1345', flag: 'ky', name: 'Cayman Islands' },
    { code: '+236', flag: 'cf', name: 'Central African Republic' },
    { code: '+235', flag: 'td', name: 'Chad' },
    { code: '+56', flag: 'cl', name: 'Chile' },
    { code: '+86', flag: 'cn', name: 'China' },
    { code: '+57', flag: 'co', name: 'Colombia' },
    { code: '+269', flag: 'km', name: 'Comoros' },
    { code: '+242', flag: 'cg', name: 'Congo' },
    { code: '+243', flag: 'cd', name: 'Congo (Democratic Republic)' },
    { code: '+506', flag: 'cr', name: 'Costa Rica' },
    { code: '+225', flag: 'ci', name: 'Côte d\'Ivoire' },
    { code: '+385', flag: 'hr', name: 'Croatia' },
    { code: '+53', flag: 'cu', name: 'Cuba' },
    { code: '+357', flag: 'cy', name: 'Cyprus' },
    { code: '+420', flag: 'cz', name: 'Czech Republic' },
    { code: '+45', flag: 'dk', name: 'Denmark' },
    { code: '+253', flag: 'dj', name: 'Djibouti' },
    { code: '+1767', flag: 'dm', name: 'Dominica' },
    { code: '+1809', flag: 'do', name: 'Dominican Republic' },
    { code: '+593', flag: 'ec', name: 'Ecuador' },
    { code: '+20', flag: 'eg', name: 'Egypt' },
    { code: '+503', flag: 'sv', name: 'El Salvador' },
    { code: '+240', flag: 'gq', name: 'Equatorial Guinea' },
    { code: '+291', flag: 'er', name: 'Eritrea' },
    { code: '+372', flag: 'ee', name: 'Estonia' },
    { code: '+251', flag: 'et', name: 'Ethiopia' },
    { code: '+500', flag: 'fk', name: 'Falkland Islands' },
    { code: '+298', flag: 'fo', name: 'Faroe Islands' },
    { code: '+679', flag: 'fj', name: 'Fiji' },
    { code: '+358', flag: 'fi', name: 'Finland' },
    { code: '+33', flag: 'fr', name: 'France' },
    { code: '+594', flag: 'gf', name: 'French Guiana' },
    { code: '+689', flag: 'pf', name: 'French Polynesia' },
    { code: '+241', flag: 'ga', name: 'Gabon' },
    { code: '+220', flag: 'gm', name: 'Gambia' },
    { code: '+995', flag: 'ge', name: 'Georgia' },
    { code: '+49', flag: 'de', name: 'Germany' },
    { code: '+233', flag: 'gh', name: 'Ghana' },
    { code: '+350', flag: 'gi', name: 'Gibraltar' },
    { code: '+30', flag: 'gr', name: 'Greece' },
    { code: '+299', flag: 'gl', name: 'Greenland' },
    { code: '+1473', flag: 'gd', name: 'Grenada' },
    { code: '+590', flag: 'gp', name: 'Guadeloupe' },
    { code: '+1671', flag: 'gu', name: 'Guam' },
    { code: '+502', flag: 'gt', name: 'Guatemala' },
    { code: '+224', flag: 'gn', name: 'Guinea' },
    { code: '+245', flag: 'gw', name: 'Guinea-Bissau' },
    { code: '+592', flag: 'gy', name: 'Guyana' },
    { code: '+509', flag: 'ht', name: 'Haiti' },
    { code: '+504', flag: 'hn', name: 'Honduras' },
    { code: '+852', flag: 'hk', name: 'Hong Kong' },
    { code: '+36', flag: 'hu', name: 'Hungary' },
    { code: '+354', flag: 'is', name: 'Iceland' },
    { code: '+91', flag: 'in', name: 'India' },
    { code: '+62', flag: 'id', name: 'Indonesia' },
    { code: '+98', flag: 'ir', name: 'Iran' },
    { code: '+964', flag: 'iq', name: 'Iraq' },
    { code: '+353', flag: 'ie', name: 'Ireland' },
    { code: '+972', flag: 'il', name: 'Israel' },
    { code: '+39', flag: 'it', name: 'Italy' },
    { code: '+1876', flag: 'jm', name: 'Jamaica' },
    { code: '+81', flag: 'jp', name: 'Japan' },
    { code: '+962', flag: 'jo', name: 'Jordan' },
    { code: '+7', flag: 'kz', name: 'Kazakhstan' },
    { code: '+254', flag: 'ke', name: 'Kenya' },
    { code: '+686', flag: 'ki', name: 'Kiribati' },
    { code: '+850', flag: 'kp', name: 'North Korea' },
    { code: '+82', flag: 'kr', name: 'South Korea' },
    { code: '+965', flag: 'kw', name: 'Kuwait' },
    { code: '+996', flag: 'kg', name: 'Kyrgyzstan' },
    { code: '+856', flag: 'la', name: 'Laos' },
    { code: '+371', flag: 'lv', name: 'Latvia' },
    { code: '+961', flag: 'lb', name: 'Lebanon' },
    { code: '+266', flag: 'ls', name: 'Lesotho' },
    { code: '+231', flag: 'lr', name: 'Liberia' },
    { code: '+218', flag: 'ly', name: 'Libya' },
    { code: '+423', flag: 'li', name: 'Liechtenstein' },
    { code: '+370', flag: 'lt', name: 'Lithuania' },
    { code: '+352', flag: 'lu', name: 'Luxembourg' },
    { code: '+853', flag: 'mo', name: 'Macao' },
    { code: '+389', flag: 'mk', name: 'North Macedonia' },
    { code: '+261', flag: 'mg', name: 'Madagascar' },
    { code: '+265', flag: 'mw', name: 'Malawi' },
    { code: '+60', flag: 'my', name: 'Malaysia' },
    { code: '+960', flag: 'mv', name: 'Maldives' },
    { code: '+223', flag: 'ml', name: 'Mali' },
    { code: '+356', flag: 'mt', name: 'Malta' },
    { code: '+692', flag: 'mh', name: 'Marshall Islands' },
    { code: '+596', flag: 'mq', name: 'Martinique' },
    { code: '+222', flag: 'mr', name: 'Mauritania' },
    { code: '+230', flag: 'mu', name: 'Mauritius' },
    { code: '+52', flag: 'mx', name: 'Mexico' },
    { code: '+691', flag: 'fm', name: 'Micronesia' },
    { code: '+373', flag: 'md', name: 'Moldova' },
    { code: '+377', flag: 'mc', name: 'Monaco' },
    { code: '+976', flag: 'mn', name: 'Mongolia' },
    { code: '+382', flag: 'me', name: 'Montenegro' },
    { code: '+1664', flag: 'ms', name: 'Montserrat' },
    { code: '+212', flag: 'ma', name: 'Morocco' },
    { code: '+258', flag: 'mz', name: 'Mozambique' },
    { code: '+95', flag: 'mm', name: 'Myanmar' },
    { code: '+264', flag: 'na', name: 'Namibia' },
    { code: '+674', flag: 'nr', name: 'Nauru' },
    { code: '+977', flag: 'np', name: 'Nepal' },
    { code: '+31', flag: 'nl', name: 'Netherlands' },
    { code: '+687', flag: 'nc', name: 'New Caledonia' },
    { code: '+64', flag: 'nz', name: 'New Zealand' },
    { code: '+505', flag: 'ni', name: 'Nicaragua' },
    { code: '+227', flag: 'ne', name: 'Niger' },
    { code: '+234', flag: 'ng', name: 'Nigeria' },
    { code: '+47', flag: 'no', name: 'Norway' },
    { code: '+968', flag: 'om', name: 'Oman' },
    { code: '+92', flag: 'pk', name: 'Pakistan' },
    { code: '+680', flag: 'pw', name: 'Palau' },
    { code: '+970', flag: 'ps', name: 'Palestine' },
    { code: '+507', flag: 'pa', name: 'Panama' },
    { code: '+675', flag: 'pg', name: 'Papua New Guinea' },
    { code: '+595', flag: 'py', name: 'Paraguay' },
    { code: '+51', flag: 'pe', name: 'Peru' },
    { code: '+63', flag: 'ph', name: 'Philippines' },
    { code: '+48', flag: 'pl', name: 'Poland' },
    { code: '+351', flag: 'pt', name: 'Portugal' },
    { code: '+1', flag: 'pr', name: 'Puerto Rico' },
    { code: '+974', flag: 'qa', name: 'Qatar' },
    { code: '+262', flag: 're', name: 'Réunion' },
    { code: '+40', flag: 'ro', name: 'Romania' },
    { code: '+7', flag: 'ru', name: 'Russia' },
    { code: '+250', flag: 'rw', name: 'Rwanda' },
    { code: '+590', flag: 'bl', name: 'Saint Barthélemy' },
    { code: '+1869', flag: 'kn', name: 'Saint Kitts and Nevis' },
    { code: '+1758', flag: 'lc', name: 'Saint Lucia' },
    { code: '+590', flag: 'mf', name: 'Saint Martin' },
    { code: '+508', flag: 'pm', name: 'Saint Pierre and Miquelon' },
    { code: '+1784', flag: 'vc', name: 'Saint Vincent and the Grenadines' },
    { code: '+685', flag: 'ws', name: 'Samoa' },
    { code: '+378', flag: 'sm', name: 'San Marino' },
    { code: '+239', flag: 'st', name: 'Sao Tome and Principe' },
    { code: '+966', flag: 'sa', name: 'Saudi Arabia' },
    { code: '+221', flag: 'sn', name: 'Senegal' },
    { code: '+381', flag: 'rs', name: 'Serbia' },
    { code: '+248', flag: 'sc', name: 'Seychelles' },
    { code: '+232', flag: 'sl', name: 'Sierra Leone' },
    { code: '+65', flag: 'sg', name: 'Singapore' },
    { code: '+421', flag: 'sk', name: 'Slovakia' },
    { code: '+386', flag: 'si', name: 'Slovenia' },
    { code: '+677', flag: 'sb', name: 'Solomon Islands' },
    { code: '+252', flag: 'so', name: 'Somalia' },
    { code: '+27', flag: 'za', name: 'South Africa' },
    { code: '+211', flag: 'ss', name: 'South Sudan' },
    { code: '+34', flag: 'es', name: 'Spain' },
    { code: '+94', flag: 'lk', name: 'Sri Lanka' },
    { code: '+249', flag: 'sd', name: 'Sudan' },
    { code: '+597', flag: 'sr', name: 'Suriname' },
    { code: '+268', flag: 'sz', name: 'Eswatini' },
    { code: '+46', flag: 'se', name: 'Sweden' },
    { code: '+41', flag: 'ch', name: 'Switzerland' },
    { code: '+963', flag: 'sy', name: 'Syria' },
    { code: '+886', flag: 'tw', name: 'Taiwan' },
    { code: '+992', flag: 'tj', name: 'Tajikistan' },
    { code: '+255', flag: 'tz', name: 'Tanzania' },
    { code: '+66', flag: 'th', name: 'Thailand' },
    { code: '+670', flag: 'tl', name: 'Timor-Leste' },
    { code: '+228', flag: 'tg', name: 'Togo' },
    { code: '+676', flag: 'to', name: 'Tonga' },
    { code: '+1868', flag: 'tt', name: 'Trinidad and Tobago' },
    { code: '+216', flag: 'tn', name: 'Tunisia' },
    { code: '+90', flag: 'tr', name: 'Turkey' },
    { code: '+993', flag: 'tm', name: 'Turkmenistan' },
    { code: '+1649', flag: 'tc', name: 'Turks and Caicos Islands' },
    { code: '+688', flag: 'tv', name: 'Tuvalu' },
    { code: '+256', flag: 'ug', name: 'Uganda' },
    { code: '+380', flag: 'ua', name: 'Ukraine' },
    { code: '+971', flag: 'ae', name: 'United Arab Emirates' },
    { code: '+44', flag: 'gb', name: 'United Kingdom' },
    { code: '+1', flag: 'us', name: 'United States' },
    { code: '+598', flag: 'uy', name: 'Uruguay' },
    { code: '+998', flag: 'uz', name: 'Uzbekistan' },
    { code: '+678', flag: 'vu', name: 'Vanuatu' },
    { code: '+58', flag: 've', name: 'Venezuela' },
    { code: '+84', flag: 'vn', name: 'Vietnam' },
    { code: '+1284', flag: 'vg', name: 'Virgin Islands, British' },
    { code: '+1340', flag: 'vi', name: 'Virgin Islands, U.S.' },
    { code: '+681', flag: 'wf', name: 'Wallis and Futuna' },
    { code: '+967', flag: 'ye', name: 'Yemen' },
    { code: '+260', flag: 'zm', name: 'Zambia' },
    { code: '+263', flag: 'zw', name: 'Zimbabwe' },
    { code: '+358', flag: 'ax', name: 'Åland Islands' }
  ];
  
  const filteredCountries = searchQuery 
    ? countries.filter(country => 
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        country.code.includes(searchQuery))
    : countries;
  
  useEffect(() => {
    if (showCountryDropdown) {
      if (dropdownRef.current && countryListRef.current) {
        const parentContainerRect = dropdownRef.current.getBoundingClientRect();
        const dropdownHeight = countryListRef.current.offsetHeight;
        const viewportHeight = window.innerHeight;

        const potentialBottomY = parentContainerRect.bottom + dropdownHeight + 10;
        const spaceAbove = parentContainerRect.top;

        if (potentialBottomY > viewportHeight && spaceAbove >= dropdownHeight + 10) {
          setDropdownPosition('top');
        } else {
          setDropdownPosition('bottom');
        }
      }
    } else {
      setDropdownPosition('bottom');
    }
  }, [showCountryDropdown]);
  
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
      <div className="mb-4 flex justify-center">
        <h2 className={`mb-4 text-center text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            WABI
        </h2>
          </div>
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
                    <div 
                      ref={countryListRef}
                      className={`absolute left-0 z-10 w-80 rounded-md border shadow-lg ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'} ${dropdownPosition === 'bottom' ? 'top-full mt-1' : 'bottom-full mb-1'}`}
                    >
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

