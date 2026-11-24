import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AppDataProvider } from './context/AppDataContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import ErrorBoundary, { reportError } from './components/ErrorBoundary.jsx';
import './styles/global.css';
import './styles/pages.css';

window.addEventListener('error', (e) => reportError(e.error || new Error(e.message)));
window.addEventListener('unhandledrejection', (e) => reportError(e.reason));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <AppDataProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AppDataProvider>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
