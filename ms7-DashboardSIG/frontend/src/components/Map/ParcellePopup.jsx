/**
 * Composant ParcellePopup - Affichage des détails d'une parcelle
 * DashboardSIG - AgroTrace-MS
 * 
 * Popup modale qui affiche:
 * - Informations de la parcelle
 * - État de santé et stress hydrique
 * - Alertes maladies
 * - Recommandations d'irrigation
 */

import React, { useState } from 'react';
import { X, Droplet, MapPin, Activity, Brain, Sprout, Camera } from 'lucide-react';
import './ParcellePopup.css';
import InformationsPanel from '../ParcelDetails/panels/InformationsPanel';
import WaterForecastPanel from '../ParcelDetails/panels/WaterForecastPanel';
import AIRecommendationsPanel from '../ParcelDetails/panels/AIRecommendationsPanel';
import AgroRulesPanel from '../ParcelDetails/panels/AgroRulesPanel';
import DiseaseDetectionPanel from '../ParcelDetails/panels/DiseaseDetectionPanel';

const ParcellePopup = ({ parcelle, onClose }) => {
  const [activeTab, setActiveTab] = useState('info');
  
  if (!parcelle) return null;

  const {
    id,
    nom,
    culture,
    stress_hydrique
  } = parcelle;

  /**
   * Retourne l'icône et le message selon le niveau de stress
   */
  const getStressInfo = () => {
    switch (stress_hydrique) {
      case 'CRITIQUE':
        return { class: 'critique' };
      case 'MODERE':
        return { class: 'modere' };
      case 'OK':
        return { class: 'ok' };
      default:
        return { class: 'unknown' };
    }
  };

  const stressInfo = getStressInfo();

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`popup-header stress-${stressInfo.class}`}>
          <div>
            <h2>{nom}</h2>
            <p className="popup-culture">{culture}</p>
          </div>
          <button className="popup-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="popup-tabs">
          <button 
            className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <MapPin size={16} />
            Informations
          </button>
          <button 
            className={`tab-button ${activeTab === 'forecast' ? 'active' : ''}`}
            onClick={() => setActiveTab('forecast')}
          >
            <Activity size={16} />
            Prévisions MS4
          </button>
          <button 
            className={`tab-button ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            <Brain size={16} />
            IA MS6
          </button>
          <button 
            className={`tab-button ${activeTab === 'rules' ? 'active' : ''}`}
            onClick={() => setActiveTab('rules')}
          >
            <Sprout size={16} />
            Règles MS5
          </button>
          <button 
            className={`tab-button ${activeTab === 'disease' ? 'active' : ''}`}
            onClick={() => setActiveTab('disease')}
          >
            <Camera size={16} />
            Détection MS3
          </button>
        </div>

        {/* Corps principal */}
        <div className="popup-body">
          {/* Tab: Informations générales */}
          {activeTab === 'info' && (
            <InformationsPanel parcelId={id} initialData={parcelle} />
          )}

          {/* Tab: Water Forecast from MS4 */}
          {activeTab === 'forecast' && (
            <div className="microservice-panel">
              <div className="panel-header">
                <h3>📊 Prévisions de Stress Hydrique (MS4)</h3>
                <p className="panel-subtitle">Service de prévision du stress hydrique sur 7 jours</p>
              </div>
              <WaterForecastPanel parcelId={id} />
            </div>
          )}

          {/* Tab: AI Recommendations from MS6 */}
          {activeTab === 'ai' && (
            <div className="microservice-panel">
              <div className="panel-header">
                <h3>🤖 Recommandations IA d'Irrigation (MS6)</h3>
                <p className="panel-subtitle">Intelligence artificielle pour l'optimisation de l'irrigation</p>
              </div>
              <AIRecommendationsPanel parcelId={id} />
            </div>
          )}

          {/* Tab: Agro Rules from MS5 */}
          {activeTab === 'rules' && (
            <div className="microservice-panel">
              <div className="panel-header">
                <h3>🌾 Évaluation des Règles Agronomiques (MS5)</h3>
                <p className="panel-subtitle">Règles métier et recommandations agronomiques</p>
              </div>
              <AgroRulesPanel parcelId={id} />
            </div>
          )}

          {/* Tab: Disease Detection from MS3 */}
          {activeTab === 'disease' && (
            <div className="microservice-panel">
              <div className="panel-header">
                <h3>🔬 Détection de Maladies par IA (MS3)</h3>
                <p className="panel-subtitle">Analyse d'images de feuilles par vision artificielle</p>
              </div>
              <DiseaseDetectionPanel parcelId={id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParcellePopup;
