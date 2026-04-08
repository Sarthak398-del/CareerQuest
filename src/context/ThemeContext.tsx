import React from 'react';

export const ThemeContext = React.createContext({
  darkMode: true,
  toggleDarkMode: () => {}
});

export const useTheme = () => React.useContext(ThemeContext);
