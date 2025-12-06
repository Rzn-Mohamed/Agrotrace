import { useState, useEffect } from 'react';
import { getAIRecommendations } from '../../../services/api';

const AIRecommendationsPanel = ({ parcelId }) => {
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendation = async () => {
      if (!parcelId) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await getAIRecommendations(parcelId);
        setRecommendation(data);
      } catch (err) {
        setError(err.message || 'Service indisponible');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendation();
  }, [parcelId]);

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Génération des recommandations IA...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-800">⚠️ {error}</p>
        <p className="text-xs text-yellow-600 mt-1">Le service MS6 (IA) est temporairement indisponible</p>
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>Aucune recommandation disponible</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-purple-900 text-lg">🤖 Recommandation IA</h4>
          {recommendation.confiance && (
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
              {(recommendation.confiance * 100).toFixed(0)}% confiance
            </span>
          )}
        </div>
        <p className="text-xs text-purple-600">
          Modèle: {recommendation.model_used || 'hybrid'} | 
          ID: {recommendation.recommendation_id?.substring(0, 8)}...
        </p>
      </div>

      {/* Plan d'irrigation */}
      <div className="bg-white border-2 border-blue-300 rounded-lg p-4">
        <h5 className="font-semibold text-blue-900 mb-3">💧 Plan d'Irrigation</h5>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded p-3">
            <p className="text-xs text-blue-600 mb-1">Volume</p>
            <p className="text-2xl font-bold text-blue-900">
              {recommendation.volume_eau_m3?.toFixed(1) || 'N/A'}
              <span className="text-sm ml-1">m³</span>
            </p>
          </div>
          <div className="bg-blue-50 rounded p-3">
            <p className="text-xs text-blue-600 mb-1">Durée</p>
            <p className="text-2xl font-bold text-blue-900">
              {recommendation.duree_minutes || 'N/A'}
              <span className="text-sm ml-1">min</span>
            </p>
          </div>
        </div>
        
        {recommendation.horaire_debut && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded p-3">
            <p className="text-sm text-green-800">
              ⏰ <span className="font-semibold">Heure optimale:</span> {recommendation.horaire_debut}
            </p>
          </div>
        )}

        {recommendation.priority && (
          <div className="mt-2">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              recommendation.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
              recommendation.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {recommendation.priority}
            </span>
          </div>
        )}
      </div>

      {/* Analyse IA */}
      {recommendation.analyse && (
        <div className="space-y-3">
          {recommendation.analyse.contexte_climat && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <h6 className="font-semibold text-gray-900 mb-2">🌤️ Contexte Climatique</h6>
              <p className="text-sm text-gray-700">{recommendation.analyse.contexte_climat}</p>
            </div>
          )}

          {recommendation.analyse.justification && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h6 className="font-semibold text-blue-900 mb-2">📋 Justification</h6>
              <p className="text-sm text-blue-800">{recommendation.analyse.justification}</p>
            </div>
          )}

          {recommendation.analyse.conseils && recommendation.analyse.conseils.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <h6 className="font-semibold text-green-900 mb-2">💡 Conseils Pratiques</h6>
              <ul className="space-y-1">
                {recommendation.analyse.conseils.map((conseil, idx) => (
                  <li key={idx} className="text-sm text-green-800 flex items-start">
                    <span className="mr-2">•</span>
                    <span>{conseil}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Instruction textuelle de fallback */}
      {recommendation.instruction_textuelle && !recommendation.analyse && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-sm text-gray-700">{recommendation.instruction_textuelle}</p>
        </div>
      )}

      {/* Statut */}
      <div className="text-center">
        <span className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold ${
          recommendation.status === 'PLANIFIE' ? 'bg-blue-100 text-blue-800' :
          recommendation.status === 'APPLIQUE' ? 'bg-green-100 text-green-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          Statut: {recommendation.status}
        </span>
      </div>
    </div>
  );
};

export default AIRecommendationsPanel;
