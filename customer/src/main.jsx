import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { registerSW } from 'virtual:pwa-register';
import { store } from './app/store';
import App from './App.jsx';
import { AuthGuardProvider } from './components/AuthGuardModal.jsx';
import './index.css';

// Only register the service worker in production builds.
// In `vite dev`, an active SW caches old JS and hides hot updates.
if (import.meta.env.PROD) {
  registerSW({ immediate: true });
} else if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
  if (typeof caches !== 'undefined') {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AuthGuardProvider>
          <App />
        </AuthGuardProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
