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
      {/* En-tête avec priorité */}
      <div className={`border-2 rounded-lg p-4 ${
        rules.priorite_irrigation === 'haute' ? 'bg-red-50 border-red-300' :
        rules.priorite_irrigation === 'moyenne' ? 'bg-yellow-50 border-yellow-300' :
        'bg-green-50 border-green-300'
      }`}>
        <div className="flex justify-between items-center">
          <h4 className="font-bold text-lg">🌾 Règles Agronomiques</h4>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            rules.priorite_irrigation === 'haute' ? 'bg-red-200 text-red-900' :
            rules.priorite_irrigation === 'moyenne' ? 'bg-yellow-200 text-yellow-900' :
            'bg-green-200 text-green-900'
          }`}>
            Priorité: {rules.priorite_irrigation}
          </span>
        </div>
        {rules.score_global !== undefined && (
          <p className="text-sm mt-2">
            Score global: <span className="font-bold">{rules.score_global.toFixed(1)}/100</span>
          </p>
        )}
      </div>

      {/* Recommandations */}
      {rules.recommandations && rules.recommandations.length > 0 && (
        <div className="space-y-2">
          <h5 className="font-semibold text-gray-900">📋 Recommandations</h5>
          {rules.recommandations.map((rec, idx) => (
            <div 
              key={idx}
              className={`border-l-4 rounded-r-lg p-3 ${
                rec.priority === 'haute' || rec.priority === 'URGENT' ? 'bg-red-50 border-red-500' :
                rec.priority === 'moyenne' || rec.priority === 'HIGH' ? 'bg-yellow-50 border-yellow-500' :
                'bg-blue-50 border-blue-500'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h6 className="font-semibold text-gray-900">{rec.title || `Règle ${rec.rule_id}`}</h6>
                {rec.priority && (
                  <span className="text-xs px-2 py-1 bg-white rounded border">
                    {rec.priority}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 mb-2">{rec.message}</p>
              {rec.action && (
                <p className="text-xs text-gray-600">
                  ⚡ Action: <span className="font-semibold">{rec.action}</span>
                </p>
              )}
              {rec.parameters && Object.keys(rec.parameters).length > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  <details>
                    <summary className="cursor-pointer hover:text-gray-900">Paramètres</summary>
                    <pre className="mt-1 bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(rec.parameters, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Règles déclenchées */}
      {rules.regles_declenchees && rules.regles_declenchees.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <h5 className="font-semibold text-gray-900 mb-2">
            ⚙️ Règles Déclenchées ({rules.regles_declenchees.length})
          </h5>
          <ul className="space-y-1">
            {rules.regles_declenchees.map((regle, idx) => (
              <li key={idx} className="text-sm text-gray-700">
                • {regle}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Timestamp */}
      {rules.timestamp && (
        <p className="text-xs text-gray-500 text-center">
          Évalué le: {new Date(rules.timestamp).toLocaleString('fr-FR')}
        </p>
      )}
    </div>
  );
};

export default AgroRulesPanel;
