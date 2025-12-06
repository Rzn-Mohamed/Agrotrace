import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { getAgroRules } from '../../../services/api';

const AgroRulesPanel = ({ parcelId }) => {
  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRules = async () => {
    if (!parcelId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await getAgroRules(parcelId);
      setRules(data);
    } catch (err) {
      setError(err.message || 'Service indisponible');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [parcelId]);

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Évaluation des règles agronomiques...</p>
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
                Le service MS5 (Règles Agro) ne répond pas actuellement.
              </p>
              <p className="text-xs text-red-600">
                Erreur: {error}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchRules}
          className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          <RefreshCw size={16} />
          Réessayer
        </button>
      </div>
    );
  }

  if (!rules) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>Aucune règle évaluée</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* En-tête avec nombre de règles déclenchées */}
      <div className={`border-2 rounded-lg p-4 ${
        rules.triggered_rules_count >= 2 ? 'bg-red-50 border-red-300' :
        rules.triggered_rules_count === 1 ? 'bg-yellow-50 border-yellow-300' :
        'bg-green-50 border-green-300'
      }`}>
        <div className="flex justify-between items-center">
          <h4 className="font-bold text-lg">🌾 Règles Agronomiques</h4>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            rules.triggered_rules_count >= 2 ? 'bg-red-200 text-red-900' :
            rules.triggered_rules_count === 1 ? 'bg-yellow-200 text-yellow-900' :
            'bg-green-200 text-green-900'
          }`}>
            {rules.triggered_rules_count || 0} règle{rules.triggered_rules_count > 1 ? 's' : ''} déclenchée{rules.triggered_rules_count > 1 ? 's' : ''}
          </span>
        </div>
        {rules.context && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {rules.context.temperature && (
              <div className="bg-white rounded p-2">
                🌡️ Temp: <span className="font-semibold">{rules.context.temperature.toFixed(1)}°C</span>
              </div>
            )}
            {rules.context.humidite_sol !== null && rules.context.humidite_sol !== undefined && (
              <div className="bg-white rounded p-2">
                💧 Sol: <span className="font-semibold">{rules.context.humidite_sol.toFixed(1)}%</span>
              </div>
            )}
            {rules.context.humidite && (
              <div className="bg-white rounded p-2">
                🌫️ Humidité: <span className="font-semibold">{rules.context.humidite.toFixed(1)}%</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recommandations */}
      {rules.recommendations && rules.recommendations.length > 0 ? (
        <div className="space-y-2">
          <h5 className="font-semibold text-gray-900">📋 Recommandations</h5>
          {rules.recommendations.map((rec, idx) => (
            <div 
              key={idx}
              className={`border-l-4 rounded-r-lg p-3 ${
                rec.priority === 'critical' ? 'bg-red-50 border-red-500' :
                rec.priority === 'high' ? 'bg-orange-50 border-orange-500' :
                rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                'bg-blue-50 border-blue-500'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h6 className="font-semibold text-gray-900">{rec.title}</h6>
                <span className={`text-xs px-2 py-1 rounded font-semibold uppercase ${
                  rec.priority === 'critical' ? 'bg-red-200 text-red-900' :
                  rec.priority === 'high' ? 'bg-orange-200 text-orange-900' :
                  rec.priority === 'medium' ? 'bg-yellow-200 text-yellow-900' :
                  'bg-blue-200 text-blue-900'
                }`}>
                  {rec.priority}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-2">{rec.message}</p>
              {rec.action && (
                <p className="text-xs text-gray-600 bg-white rounded px-2 py-1 mt-2">
                  ⚡ Action recommandée: <span className="font-semibold">{rec.action.replace(/_/g, ' ')}</span>
                </p>
              )}
              {rec.parameters && Object.keys(rec.parameters).length > 0 && (
                <div className="mt-2 text-xs">
                  <details className="bg-white rounded p-2">
                    <summary className="cursor-pointer hover:text-gray-900 font-semibold">Détails techniques</summary>
                    <div className="mt-2 space-y-1">
                      {Object.entries(rec.parameters).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600">{key.replace(/_/g, ' ')}:</span>
                          <span className="font-semibold">{typeof value === 'number' ? value.toFixed(2) : value}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-4xl mb-2">✅</div>
          <p className="font-semibold text-green-900">Aucune alerte</p>
          <p className="text-sm text-green-700 mt-1">
            Les conditions agronomiques sont satisfaisantes
          </p>
        </div>
      )}

      {/* Timestamp */}
      {rules.evaluated_at && (
        <p className="text-xs text-gray-500 text-center">
          Évalué le: {new Date(rules.evaluated_at).toLocaleString('fr-FR')}
        </p>
      )}
    </div>
  );
};

export default AgroRulesPanel;
