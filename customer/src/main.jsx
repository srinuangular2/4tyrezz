import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { registerSW } from 'virtual:pwa-register';
import { store } from './app/store';
import App from './App.jsx';
import { AuthGuardProvider } from './components/AuthGuardModal.jsx';
import './index.css';

// The install prompt only appears after a service worker is registered.
registerSW({ immediate: true });

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
