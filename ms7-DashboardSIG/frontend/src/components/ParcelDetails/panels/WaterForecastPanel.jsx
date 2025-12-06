import { useState, useEffect } from 'react';
import { getWaterForecast } from '../../../services/api';

const WaterForecastPanel = ({ parcelId }) => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-800">⚠️ {error}</p>
        <p className="text-xs text-yellow-600 mt-1">Le service de prévision MS4 est temporairement indisponible</p>
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

  return (
    <div className="p-4 space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h4 className="font-semibold text-blue-900 mb-2">
          📊 Prévisions sur {forecast.points.length} jours
        </h4>
        <p className="text-sm text-blue-700">
          Modèle: <span className="font-mono font-bold">{forecast.model}</span>
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Généré: {new Date(forecast.generated_at).toLocaleString('fr-FR')}
        </p>
      </div>

      <div className="space-y-2">
        {forecast.points.map((point, index) => (
          <div 
            key={index}
            className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-900">
                {new Date(point.timestamp).toLocaleDateString('fr-FR', { 
                  weekday: 'short', 
                  day: 'numeric', 
                  month: 'short' 
                })}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                point.hydric_stress > 60 ? 'bg-red-100 text-red-800' :
                point.hydric_stress > 30 ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {point.hydric_stress.toFixed(1)}% stress
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Humidité sol:</span>
                <span className="ml-2 font-semibold">{point.soil_moisture.toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-gray-600">Besoin irrigation:</span>
                <span className="ml-2 font-semibold">{point.irrigation_need_mm.toFixed(1)} mm</span>
              </div>
            </div>

            {point.confidence && (
              <div className="mt-2 text-xs text-gray-500">
                Intervalle: {point.confidence.lower.toFixed(1)} - {point.confidence.upper.toFixed(1)}%
              </div>
            )}
          </div>
        ))}
      </div>

      {forecast.recommendations && forecast.recommendations.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <h5 className="font-semibold text-green-900 mb-2">🌱 Recommandations</h5>
          <ul className="space-y-1">
            {forecast.recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-green-800">
                • {rec.title || rec.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default WaterForecastPanel;
