import React from 'react';
import { Text } from 'react-native';
import { fontSizes } from '../config/typography';

const AppText = ({ size = 'md', style, children, ...props }) => {
  const fontSize = typeof size === 'number' ? size : (fontSizes[size] || fontSizes.md);
  return (
    <Text style={[{ fontSize }, style]} {...props}>
      {children}
    </Text>
  );
};

export default AppText;