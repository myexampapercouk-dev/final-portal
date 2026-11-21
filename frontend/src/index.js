import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { showUkTimeEverywhere } from './utils/ukTime';

showUkTimeEverywhere(); // every date and time on the site is shown in UK time

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Frontend build marker: 2026-11-12 (total-questions form)

// Deploy check 2026-11-18: text-only change
