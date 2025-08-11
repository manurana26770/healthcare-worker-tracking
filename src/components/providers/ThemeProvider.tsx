'use client';

import { Grommet, ThemeType } from 'grommet';
import { ReactNode } from 'react';

const healthcareTheme: ThemeType = {
  global: {
    colors: {
      brand: '#00796B',
      'accent-1': '#4CAF50',
      'accent-2': '#FF9800',
      'accent-3': '#F44336',
      'neutral-1': '#607D8B',
      'neutral-2': '#9E9E9E',
      'neutral-3': '#E0E0E0',
      'neutral-4': '#F5F5F5',
      focus: '#00796B',
    },
    font: {
      family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    },
    spacing: '24px',
  },
  button: {
    border: {
      radius: '8px',
    },
    primary: {
      background: { color: 'brand' },
      border: { color: 'brand' },
      color: 'white',
    },
    secondary: {
      background: { color: 'transparent' },
      border: { color: 'brand' },
      color: 'brand',
    },
  },
  card: {
    container: {
      background: 'white',
      elevation: 'medium',
      round: '8px',
    },
  },
  formField: {
    border: {
      color: 'neutral-3',
      position: 'outer',
    },
    focus: {
      border: {
        color: 'focus',
      },
    },
  },
  text: {
    medium: {
      size: '16px',
    },
  },
};

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <Grommet theme={healthcareTheme} full>
      {children}
    </Grommet>
  );
} 