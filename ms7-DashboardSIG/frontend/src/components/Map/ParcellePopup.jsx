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
import { X, Droplet, AlertTriangle, MapPin, Calendar, TrendingUp, Activity, Brain, Sprout } from 'lucide-react';
import './ParcellePopup.css';
import WaterForecastPanel from '../ParcelDetails/panels/WaterForecastPanel';
import AIRecommendationsPanel from '../ParcelDetails/panels/AIRecommendationsPanel';
import AgroRulesPanel from '../ParcelDetails/panels/AgroRulesPanel';

const ParcellePopup = ({ parcelle, onClose }) => {
  const [activeTab, setActiveTab] = useState('info');
  
  if (!parcelle) return null;

  const {
    id,
    nom,
    culture,
    superficie_ha,
    date_semis,
    stress_hydrique,
    niveau_stress,
    besoin_eau_mm,
    derniere_irrigation,
    alertes = [],
    recommandations = []
  } = parcelle;

  /**
   * Formate une date au format français
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  /**
   * Détermine la classe CSS selon le niveau de stress
   */
  const getStressClass = (stress) => {
    return stress?.toLowerCase() || 'unknown';
  };

  /**
   * Retourne l'icône et le message selon le niveau de stress
   */
  const getStressInfo = () => {
    switch (stress_hydrique) {
      case 'CRITIQUE':
        return {
          icon: '🔴',
          message: 'Irrigation urgente requise',
          class: 'critique'
        };
      case 'MODERE':
        return {
          icon: '🟡',
          message: 'Surveillance recommandée',
          class: 'modere'
        };
      case 'OK':
        return {
          icon: '🟢',
          message: 'État hydrique optimal',
          class: 'ok'
        };
      default:
        return {
          icon: '⚪',
          message: 'État inconnu',
          class: 'unknown'
        };
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
        </div>

        {/* Corps principal */}
        <div className="popup-body">
          {/* Tab: Informations générales */}
          {activeTab === 'info' && (
            <>
          <section className="popup-section">
            <h3><MapPin size={18} /> Informations Générales</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">ID Parcelle:</span>
                <span className="info-value">#{id}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Superficie:</span>
                <span className="info-value">{superficie_ha} ha</span>
              </div>
              <div className="info-item">
                <span className="info-label">Date semis:</span>
                <span className="info-value">{formatDate(date_semis)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Dernière irrigation:</span>
                <span className="info-value">{formatDate(derniere_irrigation)}</span>
              </div>
            </div>
          </section>

          {/* État hydrique */}
          <section className="popup-section">
            <h3><Droplet size={18} /> État Hydrique</h3>
            <div className={`stress-badge stress-${stressInfo.class}`}>
              <span className="stress-icon">{stressInfo.icon}</span>
              <div>
                <div className="stress-level">{stress_hydrique}</div>
                <div className="stress-message">{stressInfo.message}</div>
              </div>
            </div>
            
            <div className="stress-details">
              <div className="stress-bar-container">
                <div className="stress-bar-label">
                  <span>Niveau de stress</span>
                  <span className="stress-percentage">{(niveau_stress * 100).toFixed(0)}%</span>
                </div>
                <div className="stress-bar">
                  <div 
                    className={`stress-bar-fill stress-${stressInfo.class}`}
                    style={{ width: `${niveau_stress * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="water-need">
                <Droplet size={16} />
                <span>Besoin en eau: <strong>{besoin_eau_mm} mm</strong></span>
              </div>
            </div>
          </section>

          {/* Alertes maladies */}
          {alertes.length > 0 && (
            <section className="popup-section">
              <h3><AlertTriangle size={18} /> Alertes Maladies ({alertes.length})</h3>
              <div className="alertes-list">
                {alertes.map((alerte) => (
                  <div key={alerte.id} className={`alerte-card severite-${alerte.severite?.toLowerCase()}`}>
                    <div className="alerte-header">
                      <span className="alerte-type">{alerte.type_maladie}</span>
                      <span className={`alerte-badge severite-${alerte.severite?.toLowerCase()}`}>
                        {alerte.severite}
                      </span>
                    </div>
                    <p className="alerte-description">{alerte.description}</p>
                    <div className="alerte-meta">
                      <span>Confiance IA: {(alerte.confiance * 100).toFixed(0)}%</span>
                      <span>{formatDate(alerte.date_detection)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recommandations d'irrigation */}
          {recommandations.length > 0 && (
            <section className="popup-section">
              <h3><TrendingUp size={18} /> Recommandations d'Irrigation ({recommandations.length})</h3>
              <div className="recommandations-list">
                {recommandations.map((reco) => (
                  <div key={reco.id} className={`reco-card priorite-${reco.priorite?.toLowerCase()}`}>
                    <div className="reco-header">
                      <span className={`reco-badge priorite-${reco.priorite?.toLowerCase()}`}>
                        {reco.priorite}
                      </span>
                      <span className="reco-date">{formatDate(reco.date_recommandation)}</span>
                    </div>
                    <div className="reco-details">
                      <div className="reco-item">
                        <Droplet size={16} />
                        <span>Volume: <strong>{reco.volume_mm} mm</strong></span>
                      </div>
                      <div className="reco-item">
                        <Calendar size={16} />
                        <span>Durée: <strong>{reco.duree_minutes} min</strong></span>
                      </div>
                      {reco.heure_optimale && (
                        <div className="reco-item">
                          <span>Heure optimale: <strong>{reco.heure_optimale}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Message si pas d'alertes ni de recommandations */}
          {alertes.length === 0 && recommandations.length === 0 && stress_hydrique === 'OK' && (
            <div className="no-issues">
              <span className="no-issues-icon">✅</span>
              <p>Aucune alerte ou recommandation pour cette parcelle</p>
              <p className="no-issues-subtitle">La parcelle est en bon état</p>
            </div>
          )}
          </>
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
        </div>
      </div>
    </div>
  );
};

export default ParcellePopup;
