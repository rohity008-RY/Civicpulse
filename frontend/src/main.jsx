import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './styles/globals.css';
import './styles/citizen.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1 }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1A2235',
              color: '#F0F4FF',
              border: '1px solid rgba(255,255,255,0.1)',
              fontFamily: 'DM Sans, sans-serif'
            }
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
