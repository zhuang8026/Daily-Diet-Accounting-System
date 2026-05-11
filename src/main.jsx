import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';

// Tailwind CSS
import '@/assets/css/tailwind.css';

// Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';

// custom css
import '@/assets/scss/_root.scss';
import '@/assets/scss/index.scss';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
