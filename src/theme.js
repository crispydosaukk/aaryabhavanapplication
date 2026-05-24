// src/theme/colors.js

const colors = {
  // Primary Colors
  primary: {
    red: '#D32F2F',
    redLight: '#FF6659',
    redDark: '#9A0007',
    mustard: '#F4B400',
    mustardLight: '#FFCE4B',
    mustardDark: '#C18F00',
  },

  // Accent Colors (complementary to primary scheme)
  accent: {
    cream: '#FFF8E1',
    burgundy: '#800020',
    rust: '#B7410E',
  },

  // Neutral Colors
  neutral: {
    white: '#FFFFFF',
    black: '#000000',
    gray100: '#F5F5F5',
    gray200: '#EEEEEE',
    gray300: '#E0E0E0',
    gray400: '#BDBDBD',
    gray500: '#9E9E9E',
    gray600: '#757575',
    gray700: '#616161',
    gray800: '#424242',
    gray900: '#212121',
  },

  // Semantic Colors
  semantic: {
    success: '#43A047',
    error: '#D32F2F',
    warning: '#F4B400',
    info: '#1976D2',
  },

  // Opacity Variants
  opacity: {
    red: {
      50: 'rgba(211, 47, 47, 0.5)',
      25: 'rgba(211, 47, 47, 0.25)',
      10: 'rgba(211, 47, 47, 0.1)',
    },
    mustard: {
      50: 'rgba(244, 180, 0, 0.5)',
      25: 'rgba(244, 180, 0, 0.25)',
      10: 'rgba(244, 180, 0, 0.1)',
    },
  },

  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#FFF8E1',
    tertiary: '#FFEBEE',
  },

  // Text Colors
  text: {
    primary: '#212121',
    secondary: '#757575',
    tertiary: '#9E9E9E',
    onPrimary: '#FFFFFF',
    onMustard: '#000000',
  }
};

// Common gradients
const gradients = {
  redMustard: ['#D32F2F', '#F4B400'],
  mustardRed: ['#F4B400', '#D32F2F'],
  redLight: ['#D32F2F', '#FF6659'],
  mustardLight: ['#F4B400', '#FFCE4B'],
};

export { colors, gradients };