import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { getAIRecommendations } from '../../../services/api';

const AIRecommendationsPanel = ({ parcelId }) => {
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
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
      <div className="p-4 space-y-3">
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-3xl">⚠️</div>
            <div className="flex-1">
              <h4 className="font-bold text-red-900 mb-1">Service Temporairement Indisponible</h4>
              <p className="text-sm text-red-700 mb-2">
                Le service MS6 (IA) ne répond pas actuellement.
              </p>
              <p className="text-xs text-red-600">
                Erreur: {error}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchRecommendation}
          className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          <RefreshCw size={16} />
          Réessayer
        </button>
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
          {recommendation.score_confiance && (
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
              {recommendation.score_confiance}% confiance
            </span>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-purple-600">
          <span>Généré par: {recommendation.genere_par || 'IA Hybride'}</span>
          <span>ID: {recommendation.recommendation_id?.substring(0, 8)}...</span>
        </div>
      </div>

      {/* Statut */}
      {recommendation.status && (
        <div className={`border-2 rounded-lg p-3 ${
          recommendation.status === 'PLANIFIE_IA' ? 'bg-blue-50 border-blue-300' :
          recommendation.status === 'URGENT' ? 'bg-red-50 border-red-300' :
          'bg-green-50 border-green-300'
        }`}>
          <p className="text-sm font-semibold">
            📌 Statut: <span className="font-bold">{recommendation.status}</span>
          </p>
        </div>
      )}

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
              ⏰ <span className="font-semibold">Heure optimale:</span>{' '}
              {new Date(recommendation.horaire_debut).toLocaleString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        )}

        {recommendation.instruction_textuelle && (
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm text-blue-800">
              💬 <span className="font-semibold">Instruction:</span> {recommendation.instruction_textuelle}
            </p>
          </div>
        )}
      </div>

      {/* Analyse Contextuelle */}
      {recommendation.analyse_contextuelle && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
          <h6 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
            🌤️ Analyse Contextuelle
          </h6>
          <p className="text-sm text-amber-800 leading-relaxed">
            {recommendation.analyse_contextuelle}
          </p>
        </div>
      )}

      {/* Justification Agronomique */}
      {recommendation.justification_agronomique && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
          <h6 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
            🌾 Justification Agronomique
          </h6>
          <p className="text-sm text-green-800 leading-relaxed">
            {recommendation.justification_agronomique}
          </p>
        </div>
      )}

      {/* Conseils Additionnels */}
      {recommendation.conseils_additionnels && recommendation.conseils_additionnels.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
          <h6 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            💡 Conseils Pratiques
          </h6>
          <ul className="space-y-2">
            {recommendation.conseils_additionnels.map((conseil, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                <span className="font-bold text-blue-600 mt-0.5">•</span>
                <span className="flex-1">{conseil}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AIRecommendationsPanel;
