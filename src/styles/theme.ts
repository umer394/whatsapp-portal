/**
 * Theme configuration for the WhatsApp Portal
 * Contains colors, gradients, and other theme-related values
 */

export const colors = {
  // WhatsApp brand colors
  whatsappLight: '#25D366',  // Light green
  whatsappDark: '#128C7E',   // Dark green
  whatsappTeal: '#075E54',   // Teal (header background)
  whatsappBlue: '#34B7F1',   // Blue (read receipts)
  
  // UI colors
  textPrimary: '#111B21',    // Primary text
  textSecondary: '#54656F',  // Secondary text
  background: '#FFFFFF',     // Main background
  backgroundLight: '#F0F2F5', // Light background (chat list)
  borderColor: '#E9EDEF',    // Border color
  
  // Status colors
  success: '#25D366',        // Success/online
  error: '#E74C3C',          // Error/failed
  warning: '#FFA500',        // Warning
  info: '#34B7F1',           // Info
};

export const gradients = {
  // Primary gradient used for buttons and highlights
  primary: {
    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
    hover: 'linear-gradient(135deg, #22C35E 0%, #107C70 100%)',
  },
  
  // Other gradients
  blue: {
    background: 'linear-gradient(135deg, #34B7F1 0%, #1A91C9 100%)',
  },
};

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
};

export const borderRadius = {
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  full: '9999px',
};

export const fonts = {
  primary: "'Mabry Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  monospace: "Menlo, Monaco, Consolas, 'Courier New', monospace",
};

// Common component styles
export const buttonStyles = {
  primary: {
    background: gradients.primary.background,
    color: 'white',
    hover: 'opacity: 0.9',
    disabled: 'opacity: 0.7',
  },
  secondary: {
    background: colors.backgroundLight,
    color: colors.textPrimary,
    hover: 'background: #E9EDEF',
  },
};

// Export the theme object
const theme = {
  colors,
  gradients,
  shadows,
  borderRadius,
  fonts,
  buttonStyles,
};

export default theme; 