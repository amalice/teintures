import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { LangueProvider } from './i18n';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <LangueProvider>
      <App />
    </LangueProvider>
  </React.StrictMode>
);