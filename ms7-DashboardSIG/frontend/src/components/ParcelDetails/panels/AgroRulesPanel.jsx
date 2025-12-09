import { useState, useEffect } from 'react';
import { RefreshCw, ThermometerSun, Droplets, Wind, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Zap, Shield, Leaf } from 'lucide-react';
import { getAgroRules } from '../../../services/api';

const AgroRulesPanel = ({ parcelId }) => {
  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRules, setExpandedRules] = useState({});

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

  const toggleRule = (idx) => {
    setExpandedRules(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Skeleton loader
  if (loading) {
    return (
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              flex: 1,
              height: '70px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
              animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.1}s`
            }} />
          ))}
        </div>
        <div style={{
          height: '100px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
          animation: 'pulse 1.5s ease-in-out infinite'
        }} />
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
        <p style={{ textAlign: 'center', fontSize: '13px', color: '#6b7280', marginTop: '16px' }}>
          Évaluation des règles agronomiques...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '16px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
          border: '2px solid #fca5a5',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ fontSize: '32px' }}>⚠️</div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontWeight: 700, color: '#7f1d1d', marginBottom: '4px', fontSize: '15px' }}>
                Service Temporairement Indisponible
              </h4>
              <p style={{ fontSize: '13px', color: '#b91c1c', marginBottom: '8px' }}>
                Le service MS5 (Règles Agro) ne répond pas actuellement.
              </p>
              <p style={{ fontSize: '11px', color: '#dc2626', fontFamily: 'monospace' }}>
                {error}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchRules}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            fontWeight: 600,
            padding: '12px 16px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
          }}
        >
          <RefreshCw size={16} />
          Réessayer
        </button>
      </div>
    );
  }

  if (!rules) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
        <Shield size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
        <p>Aucune règle évaluée</p>
      </div>
    );
  }

  const triggeredCount = rules.triggered_rules_count || 0;
  const getStatusConfig = () => {
    if (triggeredCount >= 2) return { 
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      bg: '#fef2f2',
      border: '#fca5a5',
      text: '#7f1d1d',
      label: 'Attention Requise',
      icon: AlertTriangle
    };
    if (triggeredCount === 1) return { 
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      bg: '#fffbeb',
      border: '#fcd34d',
      text: '#78350f',
      label: 'Surveillance',
      icon: AlertTriangle
    };
    return { 
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      bg: '#ecfdf5',
      border: '#6ee7b7',
      text: '#065f46',
      label: 'Optimal',
      icon: CheckCircle
    };
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'critical':
        return { gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', bg: '#fef2f2', text: '#7f1d1d', border: '#fca5a5' };
      case 'high':
        return { gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', bg: '#fff7ed', text: '#7c2d12', border: '#fdba74' };
      case 'medium':
        return { gradient: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', bg: '#fefce8', text: '#713f12', border: '#fde047' };
      default:
        return { gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', bg: '#eff6ff', text: '#1e3a8a', border: '#93c5fd' };
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* Status Header */}
      <div style={{
        background: statusConfig.bg,
        border: `2px solid ${statusConfig.border}`,
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative gradient bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: statusConfig.gradient
        }} />
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: statusConfig.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 12px ${statusConfig.border}80`
            }}>
              <StatusIcon size={22} color="white" />
            </div>
            <div>
              <h4 style={{ fontWeight: 700, fontSize: '15px', color: statusConfig.text, margin: 0 }}>
                {statusConfig.label}
              </h4>
              <p style={{ fontSize: '12px', color: statusConfig.text, opacity: 0.8, margin: 0, marginTop: '2px' }}>
                {triggeredCount} règle{triggeredCount > 1 ? 's' : ''} déclenchée{triggeredCount > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div style={{
            padding: '8px 14px',
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <span style={{ fontSize: '22px', fontWeight: 800, color: statusConfig.text }}>
              {triggeredCount}
            </span>
          </div>
        </div>
      </div>

      {/* Context Metrics */}
      {rules.context && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {rules.context.temperature !== undefined && (
            <div style={{
              background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
              border: '1.5px solid #fed7aa',
              borderRadius: '14px',
              padding: '14px 12px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
                boxShadow: '0 4px 10px rgba(249, 115, 22, 0.3)'
              }}>
                <ThermometerSun size={16} color="white" />
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#c2410c' }}>
                {rules.context.temperature.toFixed(1)}°C
              </div>
              <div style={{ fontSize: '10px', color: '#9a3412', fontWeight: 500, marginTop: '2px' }}>
                Température
              </div>
            </div>
          )}
          
          {rules.context.humidite_sol !== undefined && rules.context.humidite_sol !== null && (
            <div style={{
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              border: '1.5px solid #93c5fd',
              borderRadius: '14px',
              padding: '14px 12px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
                boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)'
              }}>
                <Droplets size={16} color="white" />
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#1d4ed8' }}>
                {rules.context.humidite_sol.toFixed(1)}%
              </div>
              <div style={{ fontSize: '10px', color: '#1e40af', fontWeight: 500, marginTop: '2px' }}>
                Sol
              </div>
            </div>
          )}
          
          {rules.context.humidite !== undefined && (
            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '1.5px solid #86efac',
              borderRadius: '14px',
              padding: '14px 12px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
                boxShadow: '0 4px 10px rgba(34, 197, 94, 0.3)'
              }}>
                <Wind size={16} color="white" />
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#15803d' }}>
                {rules.context.humidite.toFixed(1)}%
              </div>
              <div style={{ fontSize: '10px', color: '#166534', fontWeight: 500, marginTop: '2px' }}>
                Humidité
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      {rules.recommendations && rules.recommendations.length > 0 ? (
        <div>
          <h5 style={{ 
            fontSize: '13px', 
            fontWeight: 700, 
            color: '#1f2937', 
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Zap size={15} />
            Actions recommandées
          </h5>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {rules.recommendations.map((rec, idx) => {
              const config = getPriorityConfig(rec.priority);
              const isExpanded = expandedRules[idx];
              
              return (
                <div 
                  key={idx}
                  style={{
                    background: config.bg,
                    border: `1.5px solid ${config.border}`,
                    borderRadius: '14px',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Priority bar */}
                  <div style={{ height: '3px', background: config.gradient }} />
                  
                  <div style={{ padding: '14px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <h6 style={{ fontWeight: 700, fontSize: '13px', color: config.text, margin: 0, flex: 1 }}>
                        {rec.title}
                      </h6>
                      <span style={{
                        fontSize: '9px',
                        padding: '3px 8px',
                        background: config.gradient,
                        color: 'white',
                        borderRadius: '8px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        marginLeft: '8px'
                      }}>
                        {rec.priority}
                      </span>
                    </div>
                    
                    {/* Message */}
                    <p style={{ fontSize: '12px', color: config.text, opacity: 0.85, margin: 0, lineHeight: 1.5 }}>
                      {rec.message}
                    </p>
                    
                    {/* Action button */}
                    {rec.action && (
                      <div style={{
                        marginTop: '10px',
                        padding: '8px 12px',
                        background: 'white',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                      }}>
                        <Leaf size={14} style={{ color: config.text }} />
                        <span style={{ fontSize: '11px', fontWeight: 600, color: config.text }}>
                          {rec.action.replace(/_/g, ' ')}
                        </span>
                      </div>
                    )}
                    
                    {/* Technical details toggle */}
                    {rec.parameters && Object.keys(rec.parameters).length > 0 && (
                      <div style={{ marginTop: '10px' }}>
                        <button
                          onClick={() => toggleRule(idx)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: config.text,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            opacity: 0.7
                          }}
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          Détails techniques
                        </button>
                        
                        {isExpanded && (
                          <div style={{
                            marginTop: '8px',
                            padding: '10px',
                            background: 'white',
                            borderRadius: '8px',
                            fontSize: '11px'
                          }}>
                            {Object.entries(rec.parameters).map(([key, value]) => (
                              <div key={key} style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                padding: '4px 0',
                                borderBottom: '1px solid #f3f4f6'
                              }}>
                                <span style={{ color: '#6b7280' }}>{key.replace(/_/g, ' ')}</span>
                                <span style={{ fontWeight: 600, color: '#374151', fontFamily: 'monospace' }}>
                                  {typeof value === 'number' ? value.toFixed(2) : value}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{
          background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
          border: '2px solid #6ee7b7',
          borderRadius: '16px',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
          }}>
            <CheckCircle size={28} color="white" />
          </div>
          <h5 style={{ fontWeight: 700, fontSize: '15px', color: '#065f46', margin: 0 }}>
            Tout est optimal !
          </h5>
          <p style={{ fontSize: '12px', color: '#047857', marginTop: '6px' }}>
            Les conditions agronomiques sont satisfaisantes
          </p>
        </div>
      )}

      {/* Timestamp */}
      {rules.evaluated_at && (
        <p style={{ 
          fontSize: '11px', 
          color: '#9ca3af', 
          textAlign: 'center', 
          marginTop: '16px',
          fontStyle: 'italic'
        }}>
          Évalué le {new Date(rules.evaluated_at).toLocaleString('fr-FR')}
        </p>
      )}
    </div>
  );
};

export default AgroRulesPanel;
