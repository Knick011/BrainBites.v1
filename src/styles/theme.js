// src/styles/theme.js
const theme = {
    // Core Colors - matching web version
    colors: {
      primary: '#FF9F1C',       // Primary orange
      secondary: '#FFB347',     // Secondary orange
      lightOrange: '#FFE5B4',   // Light orange
      warmYellow: '#FFD700',    // Warm yellow
      background: '#FFF8E7',    // Background light cream
      textDark: '#333333',      // Text dark
      textMuted: '#777777',     // Text muted
      success: '#2ECC71',       // Success green
      error: '#E74C3C',         // Error red
      successLight: 'rgba(46, 204, 113, 0.15)',
      errorLight: 'rgba(231, 76, 60, 0.15)',
      white: '#FFFFFF',
    },
    
    // Gradients
    gradients: {
      primary: ['#FF9F1C', '#FFB347'],
      secondary: ['#FFB347', '#FFD700'],
      success: ['#22c55e', '#16a34a'],
      error: ['#ef4444', '#dc2626'],
    },
    
    // Spacing - like the web version
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48,
    },
    
    // Border Radius - matching web version
    borderRadius: {
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      full: 9999,
    },
    
    // Shadows - adapted for React Native
    shadows: {
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 5,
      },
      btn: {
        shadowColor: 'rgba(255, 159, 28, 0.25)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 6,
        elevation: 4,
      },
    },
    
    // Font configuration - scaled for mobile
    typography: {
      fontFamily: 'System',  // Use system font since we don't have Fredoka
      fontSize: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 20,
        xxl: 24,
        title: 28,
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
    
    // Animation durations - matching web
    animation: {
      fast: 200,
      normal: 300,
      slow: 500,
    },
  };
  
  export default theme;