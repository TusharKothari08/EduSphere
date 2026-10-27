
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import { AuthProvider } from './auth/AuthProvider';
import './index.css';

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

try {
  document.documentElement.dataset.theme =
    localStorage.getItem('edemy_theme') === 'dark' ? 'dark' : 'light';
} catch {
  document.documentElement.dataset.theme = 'light';
}

if (!clerkKey) {
  throw new Error(
    'Clerk publishable key is missing. Check client/.env and restart Vite.',
  );
}

const application = (
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

createRoot(document.getElementById('root')).render(
  <ClerkProvider publishableKey={clerkKey}>
    {application}
  </ClerkProvider>,
);
