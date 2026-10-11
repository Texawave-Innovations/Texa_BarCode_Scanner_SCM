import { StatusBar } from 'expo-status-bar';
import React from 'react';
import Navigation from './src/navigation';
import { SessionProvider } from './src/session';

export default function App() {
  return (
    <SessionProvider>
      <Navigation />
      <StatusBar style="dark" />
    </SessionProvider>
  );
}
