import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './app/store';
import App from './App.jsx';
import { AuthGuardProvider } from './components/AuthGuardModal.jsx';
import './index.css';

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
