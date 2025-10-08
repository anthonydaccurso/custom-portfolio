import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Check for StackBlitz environment
const isStackBlitz = 
  window.location.hostname === 'stackblitz.com' || 
  window.location.hostname.includes('stackblitz.io') ||
  window.location.hostname.includes('.webcontainer.io') ||
  typeof window !== 'undefined' && 'WebContainer' in window;

// Only register service worker in production and non-StackBlitz environments
if (import.meta.env.PROD && 'serviceWorker' in navigator && !isStackBlitz) {
  window.addEventListener('load', () => {
    (async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('SW registered:', registration);
      } catch (error) {
        console.error('SW registration failed:', error);
      }
    })();
  });
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);