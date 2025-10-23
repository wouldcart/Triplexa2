
import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { ApplicationSettingsProvider } from './contexts/ApplicationSettingsContext'
import { AuthProvider } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'
import { StaffNotificationProvider } from './contexts/StaffNotificationContext'
import { Toaster } from './components/ui/sonner'
import App from './App.tsx'
import './index.css'
import { AgentHeaderProvider } from './contexts/AgentHeaderContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ApplicationSettingsProvider>
            <AuthProvider>
              <AgentHeaderProvider>
                <AppProvider>
                  <StaffNotificationProvider>
                    <App />
                    <Toaster />
                  </StaffNotificationProvider>
                </AppProvider>
              </AgentHeaderProvider>
            </AuthProvider>
          </ApplicationSettingsProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
