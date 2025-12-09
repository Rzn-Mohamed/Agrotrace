import { useState, useEffect } from 'react';
import { RefreshCw, Sparkles, Clock, Droplet, CheckCircle, AlertTriangle } from 'lucide-react';
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
      <div className="ai-panel-loading">
        <div className="ai-loading-spinner"></div>
        <p>Génération des recommandations IA...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-panel-error">
        <div className="error-card">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <h4>Service Temporairement Indisponible</h4>
            <p>Le service MS6 (IA) ne répond pas actuellement.</p>
            <span className="error-detail">Erreur: {error}</span>
          </div>
        </div>
        <button onClick={fetchRecommendation} className="retry-btn">
          <RefreshCw size={16} />
          Réessayer
        </button>
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className="ai-panel-empty">
        <Sparkles size={32} className="empty-icon" />
        <p>Aucune recommandation disponible</p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      'PLANIFIE_IA': { color: 'blue', icon: <Clock size={12} />, label: 'Planifié' },
      'URGENT': { color: 'red', icon: <AlertTriangle size={12} />, label: 'Urgent' },
      'COMPLETE': { color: 'green', icon: <CheckCircle size={12} />, label: 'Complété' }
    };
    return statusConfig[status] || statusConfig['PLANIFIE_IA'];
  };

  const statusInfo = getStatusBadge(recommendation.status);

  return (
    <div className="ai-panel">
      {/* AI Chat Bubble Header */}
      <div className="ai-chat-bubble">
        <div className="ai-avatar">
          <Sparkles size={20} />
        </div>
        <div className="ai-message">
          <div className="ai-message-header">
            <span className="ai-name">Assistant IA Gemini</span>
            <span className="ms-badge ms6">MS6</span>
          </div>
          
          {/* Confidence Score */}
          {recommendation.score_confiance && (
            <div className="confidence-bar-container">
              <div className="confidence-label">
                <span>Confiance</span>
                <span className="confidence-value">{recommendation.score_confiance}%</span>
              </div>
              <div className="confidence-bar">
                <div 
                  className="confidence-fill" 
                  style={{ width: `${recommendation.score_confiance}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Status Badge */}
          {recommendation.status && (
            <div className={`status-pill status-${statusInfo.color}`}>
              {statusInfo.icon}
              <span>{statusInfo.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Irrigation Plan Card */}
      <div className="insight-card irrigation-card">
        <div className="card-header">
          <Droplet size={18} className="card-icon" />
          <h5>Plan d'Irrigation</h5>
        </div>
        <div className="irrigation-grid">
          <div className="irrigation-metric">
            <span className="metric-value">
              {recommendation.volume_eau_m3?.toFixed(1) || 'N/A'}
              <span className="metric-unit">m³</span>
            </span>
            <span className="metric-label">Volume</span>
          </div>
          <div className="irrigation-metric">
            <span className="metric-value">
              {recommendation.duree_minutes || 'N/A'}
              <span className="metric-unit">min</span>
            </span>
            <span className="metric-label">Durée</span>
          </div>
        </div>
        
        {recommendation.horaire_debut && (
          <div className="schedule-info">
            <Clock size={14} />
            <span>
              <strong>Heure optimale:</strong>{' '}
              {new Date(recommendation.horaire_debut).toLocaleString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        )}

        {recommendation.instruction_textuelle && (
          <div className="instruction-bubble">
            <span className="instruction-label">💬 Instruction</span>
            <p>{recommendation.instruction_textuelle}</p>
          </div>
        )}
      </div>

      {/* Analyse Contextuelle */}
      {recommendation.analyse_contextuelle && (
        <div className="insight-card analysis-card">
          <div className="card-header">
            <span className="card-emoji">🌤️</span>
            <h5>Analyse Contextuelle</h5>
          </div>
          <p className="analysis-text">{recommendation.analyse_contextuelle}</p>
        </div>
      )}

      {/* Justification Agronomique */}
      {recommendation.justification_agronomique && (
        <div className="insight-card agro-card">
          <div className="card-header">
            <span className="card-emoji">🌾</span>
            <h5>Justification Agronomique</h5>
          </div>
          <p className="analysis-text">{recommendation.justification_agronomique}</p>
        </div>
      )}

      {/* Conseils Additionnels */}
      {recommendation.conseils_additionnels && recommendation.conseils_additionnels.length > 0 && (
        <div className="insight-card tips-card">
          <div className="card-header">
            <span className="card-emoji">💡</span>
            <h5>Conseils Pratiques</h5>
          </div>
          <ul className="tips-list">
            {recommendation.conseils_additionnels.map((conseil, idx) => (
              <li key={idx}>
                <span className="tip-bullet">•</span>
                <span>{conseil}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <style jsx>{`
        .ai-panel {
          padding: 0 4px;
        }

        .ai-panel-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 20px;
          color: #6b7280;
        }

        .ai-loading-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid rgba(102, 126, 234, 0.2);
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 12px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .ai-panel-error {
          padding: 16px;
        }

        .error-card {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.06), transparent);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          margin-bottom: 12px;
        }

        .error-icon {
          font-size: 28px;
        }

        .error-content h4 {
          font-size: 14px;
          font-weight: 700;
          color: #dc2626;
          margin: 0 0 6px 0;
        }

        .error-content p {
          font-size: 13px;
          color: #6b7280;
          margin: 0 0 4px 0;
        }

        .error-detail {
          font-size: 11px;
          color: #9ca3af;
        }

        .retry-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .retry-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .ai-panel-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 20px;
          color: #9ca3af;
        }

        .empty-icon {
          margin-bottom: 12px;
          opacity: 0.5;
        }

        /* Chat Bubble */
        .ai-chat-bubble {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.04));
          border: 1px solid rgba(102, 126, 234, 0.15);
          border-radius: 16px;
          margin-bottom: 16px;
        }

        .ai-avatar {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .ai-message {
          flex: 1;
        }

        .ai-message-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        .ai-name {
          font-size: 14px;
          font-weight: 700;
          color: #111827;
        }

        .ms-badge {
          font-size: 9px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 700;
          letter-spacing: 0.3px;
        }

        .ms-badge.ms6 {
          background: rgba(245, 158, 11, 0.15);
          color: #d97706;
        }

        .confidence-bar-container {
          margin-bottom: 10px;
        }

        .confidence-label {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .confidence-value {
          font-weight: 700;
          color: #667eea;
        }

        .confidence-bar {
          height: 6px;
          background: rgba(0, 0, 0, 0.08);
          border-radius: 3px;
          overflow: hidden;
        }

        .confidence-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          border-radius: 3px;
          transition: width 0.6s ease;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        .status-pill.status-blue {
          background: rgba(59, 130, 246, 0.12);
          color: #2563eb;
        }

        .status-pill.status-red {
          background: rgba(239, 68, 68, 0.12);
          color: #dc2626;
        }

        .status-pill.status-green {
          background: rgba(16, 185, 129, 0.12);
          color: #059669;
        }

        /* Insight Cards */
        .insight-card {
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 12px;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .card-header h5 {
          font-size: 14px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .card-icon {
          color: #3b82f6;
        }

        .card-emoji {
          font-size: 16px;
        }

        .irrigation-card {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.06), rgba(255, 255, 255, 0.8));
          border-color: rgba(59, 130, 246, 0.15);
        }

        .irrigation-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }

        .irrigation-metric {
          background: rgba(255, 255, 255, 0.8);
          padding: 12px;
          border-radius: 10px;
          text-align: center;
        }

        .metric-value {
          display: block;
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          line-height: 1.2;
        }

        .metric-unit {
          font-size: 12px;
          font-weight: 500;
          color: #6b7280;
          margin-left: 2px;
        }

        .metric-label {
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.3px;
        }

        .schedule-info {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: rgba(16, 185, 129, 0.08);
          border-radius: 8px;
          font-size: 13px;
          color: #059669;
          margin-bottom: 10px;
        }

        .schedule-info strong {
          font-weight: 600;
        }

        .instruction-bubble {
          background: rgba(102, 126, 234, 0.06);
          border-radius: 10px;
          padding: 12px;
          border-left: 3px solid #667eea;
        }

        .instruction-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: #667eea;
          margin-bottom: 6px;
        }

        .instruction-bubble p {
          font-size: 13px;
          color: #374151;
          margin: 0;
          line-height: 1.5;
        }

        .analysis-card {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.06), rgba(255, 255, 255, 0.8));
          border-color: rgba(245, 158, 11, 0.15);
        }

        .agro-card {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(255, 255, 255, 0.8));
          border-color: rgba(16, 185, 129, 0.15);
        }

        .tips-card {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.06), rgba(255, 255, 255, 0.8));
          border-color: rgba(59, 130, 246, 0.15);
        }

        .analysis-text {
          font-size: 13px;
          color: #374151;
          line-height: 1.6;
          margin: 0;
        }

        .tips-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .tips-list li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 13px;
          color: #374151;
          margin-bottom: 8px;
          line-height: 1.5;
        }

        .tips-list li:last-child {
          margin-bottom: 0;
        }

        .tip-bullet {
          color: #3b82f6;
          font-weight: 700;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};

export default AIRecommendationsPanel;
