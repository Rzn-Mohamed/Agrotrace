import { useState, useEffect } from 'react';
import { Droplet, CloudRain, RefreshCw } from 'lucide-react';
import { getWaterForecast } from '../../../services/api';

const WaterForecastPanel = ({ parcelId }) => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchForecast = async () => {
    if (!parcelId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await getWaterForecast(parcelId);
      setForecast(data);
    } catch (err) {
      setError(err.message || 'Service indisponible');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [parcelId]);

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Chargement des prévisions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 space-y-3">
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-3xl">⚠️</div>
            <div className="flex-1">
              <h4 className="font-bold text-red-900 mb-1">Service Temporairement Indisponible</h4>
              <p className="text-sm text-red-700 mb-2">
                Le service de prévision MS4 ne répond pas actuellement.
              </p>
              <p className="text-xs text-red-600">
                Erreur: {error}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchForecast}
          className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          <RefreshCw size={16} />
          Réessayer
        </button>
      </div>
    );
  }

  if (!forecast || !forecast.points) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>Aucune prévision disponible</p>
      </div>
    );
  }

  /**
   * Retourne la couleur selon le niveau de stress
   */
  const getStressColor = (stress) => {
    if (stress > 60) return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' };
    if (stress > 30) return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' };
    return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' };
  };

  /**
   * Retourne l'interprétation du stress
   */
  const getStressInterpretation = (stress) => {
    if (stress > 60) return 'Stress élevé - Irrigation recommandée';
    if (stress > 30) return 'Stress modéré - Surveillance';
    return 'Stress faible - Optimal';
  };

  return (
    <div className="p-4 space-y-4">
      {/* En-tête avec métadonnées */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-blue-900 flex items-center gap-2">
            <CloudRain size={20} />
            Prévisions sur {forecast.points.length} jours
          </h4>
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono">
            {forecast.model}
          </span>
        </div>
        <p className="text-xs text-blue-600">
          Généré: {new Date(forecast.generated_at).toLocaleString('fr-FR')}
        </p>
      </div>

      {/* Timeline des prévisions - Style moderne */}
      <div className="space-y-3">
        {forecast.points.map((point, index) => {
          const stressColor = getStressColor(point.hydric_stress);
          const isToday = index === 0;
          
          return (
            <div 
              key={index}
              className={`relative bg-white rounded-lg border-2 ${
                isToday ? 'border-blue-400 shadow-lg' : 'border-gray-200 hover:border-blue-300'
              } transition-all duration-200 overflow-hidden`}
            >
              {/* Bande de couleur selon le stress */}
              <div className={`h-1 ${
                point.hydric_stress > 60 ? 'bg-red-500' :
                point.hydric_stress > 30 ? 'bg-yellow-500' : 'bg-green-500'
              }`} />
              
              <div className="p-4">
                {/* En-tête de la carte */}
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <div className="font-bold text-gray-900 text-lg">
                      {new Date(point.timestamp).toLocaleDateString('fr-FR', { 
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })}
                    </div>
                    {isToday && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                        Aujourd'hui
                      </span>
                    )}
                  </div>
                  
                  {/* Badge de stress */}
                  <div className={`${stressColor.bg} ${stressColor.text} border ${stressColor.border} px-3 py-1 rounded-full`}>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{point.hydric_stress.toFixed(0)}%</div>
                      <div className="text-xs">stress</div>
                    </div>
                  </div>
                </div>

                {/* Barre de progression visuelle */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Stress hydrique</span>
                    <span>{getStressInterpretation(point.hydric_stress)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${
                        point.hydric_stress > 60 ? 'bg-red-500' :
                        point.hydric_stress > 30 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${point.hydric_stress}%` }}
                    />
                  </div>
                </div>

                {/* Grille d'informations avec icônes */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Droplet size={16} className="text-blue-600" />
                      <span className="text-xs text-blue-600 font-medium">Humidité sol</span>
                    </div>
                    <div className="text-xl font-bold text-blue-900">
                      {point.soil_moisture.toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="bg-cyan-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CloudRain size={16} className="text-cyan-600" />
                      <span className="text-xs text-cyan-600 font-medium">Besoin irrigation</span>
                    </div>
                    <div className="text-xl font-bold text-cyan-900">
                      {point.irrigation_need_mm.toFixed(1)} mm
                    </div>
                  </div>
                </div>

                {/* Intervalle de confiance */}
                {point.confidence && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Intervalle de confiance</span>
                      <span className="font-mono text-gray-700">
                        {point.confidence.lower.toFixed(1)}% - {point.confidence.upper.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommandations */}
      {forecast.recommendations && forecast.recommendations.length > 0 && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
          <h5 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
            🌱 Recommandations
          </h5>
          <ul className="space-y-2">
            {forecast.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-green-800">
                <span className="text-green-600 font-bold">•</span>
                <span>{rec.title || rec.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default WaterForecastPanel;
