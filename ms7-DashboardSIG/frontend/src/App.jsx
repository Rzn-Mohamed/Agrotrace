/**
 * Composant principal App
 * DashboardSIG - AgroTrace-MS
 */

import React, { useState } from 'react';
import MapComponent from './components/Map/MapComponent';
import Sidebar from './components/Sidebar/Sidebar';
import './App.css';

function App() {
  const [selectedParcelle, setSelectedParcelle] = useState(null);

  const handleParcelleSelect = (parcelle) => {
    setSelectedParcelle(parcelle);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🌾</span>
            <div>
              <h1>AgroTrace-MS</h1>
              <p>Dashboard SIG - Agriculture de Précision</p>
            </div>
          </div>
          <div className="header-info">
            <div className="status-indicator">
              <span className="status-dot active"></span>
              <span>Système Actif</span>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="app-content">
        {/* Sidebar gauche */}
        <aside className="app-sidebar">
          <Sidebar selectedParcelle={selectedParcelle} />
        </aside>

        {/* Zone carte */}
        <main className="app-main">
          <MapComponent onParcelleSelect={handleParcelleSelect} />
        </main>
      </div>
    </div>
  );
}

export default App;
