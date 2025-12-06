import { useState, useEffect } from 'react';
import { MapPin, Calendar, Droplet, AlertTriangle, TrendingUp } from 'lucide-react';
import { getParcelleById } from '../../../services/api';

/**
 * Panel affichant les informations détaillées de la parcelle
 * Charge dynamiquement les données depuis l'API
 */
const InformationsPanel = ({ parcelId, initialData }) => {
  const [parcelData, setParcelData] = useState(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Si on a déjà les données initiales, pas besoin de recharger
    if (initialData) {
      setParcelData(initialData);
      return;
    }

    const fetchParcelData = async () => {
      if (!parcelId) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await getParcelleById(parcelId);
        setParcelData(data);
      } catch (err) {
        setError(err.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchParcelData();
  }, [parcelId, initialData]);

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Chargement des informations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-sm text-red-800">⚠️ {error}</p>
      </div>
    );
  }

  if (!parcelData) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>Aucune donnée disponible</p>
      </div>
    );
  }

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
  } = parcelData;

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
    <div className="space-y-4">
      {/* Informations Générales */}
      <section className="popup-section">
        <h3><MapPin size={18} /> Informations Générales</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">ID Parcelle:</span>
            <span className="info-value">#{id}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Nom:</span>
            <span className="info-value">{nom}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Culture:</span>
            <span className="info-value">{culture}</span>
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
    </div>
  );
};

export default InformationsPanel;
