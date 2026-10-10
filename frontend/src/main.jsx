import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import './index.css'

// Apply persisted/system dark-mode preference before first paint
const savedDarkMode = localStorage.getItem('darkMode')
const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
if (savedDarkMode === 'true' || (savedDarkMode === null && prefersDark)) {
  document.documentElement.classList.add('dark')
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <App />
          <Toaster
            position="top-right"
            gutter={10}
            containerStyle={{ top: 76 }}
            toastOptions={{
              duration: 4000,
              className: 'ab-toast',
              style: {
                background: 'var(--toast-bg)',
                color: 'var(--toast-fg)',
                border: '1px solid var(--toast-border)',
                borderRadius: '14px',
                boxShadow: 'var(--shadow-pop)',
                padding: '12px 14px',
                fontSize: '14px',
                fontWeight: 500,
                maxWidth: '380px',
              },
              success: {
                duration: 3000,
                iconTheme: { primary: '#348758', secondary: '#fff' },
              },
              error: {
                duration: 5000,
                iconTheme: { primary: '#dc2626', secondary: '#fff' },
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
)