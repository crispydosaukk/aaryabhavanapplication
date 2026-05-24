import { DarkTheme, DefaultTheme } from '@react-navigation/native';

// Light Theme (can be customized)
export const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: 'red',
    background: 'white',
    text: 'black',
    card: 'white',
    border: 'gray',
  },
};

// Dark Theme (can be customized)
export const DarkThemeCustom = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: 'red',
    background: '#121212',
    text: 'white',
    card: '#1c1c1c',
    border: 'gray',
  },
};
