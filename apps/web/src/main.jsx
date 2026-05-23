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
import { MobilityProvider } from './context/MobilityContext.jsx';
import { installArtifactPublishTelemetrySink } from './app/artifactPublishTelemetrySink.js';

installArtifactPublishTelemetrySink();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DashboardProvider>
      <MobilityProvider>
        <App />
      </MobilityProvider>
    </DashboardProvider>
  </React.StrictMode>,
);