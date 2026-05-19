import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import './styles/engine-components.css';
import './styles/print.css';
import './styles/workstation.css';
import './styles/pillar-score-display.css';
import './styles/lens-aware-score-display.css';
import { DashboardProvider } from './context/DashboardContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DashboardProvider>
      <App />
    </DashboardProvider>
  </React.StrictMode>,
);