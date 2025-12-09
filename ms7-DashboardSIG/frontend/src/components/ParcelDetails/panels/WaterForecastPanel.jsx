import { useState, useEffect } from 'react';
import { Droplet, CloudRain, RefreshCw, TrendingUp, TrendingDown, Minus, Calendar, ThermometerSun, Waves } from 'lucide-react';
import { getWaterForecast } from '../../../services/api';

const WaterForecastPanel = ({ parcelId }) => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);

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

  // Skeleton loader for premium feel
  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {/* Gauge skeleton */}
        <div className="flex justify-center">
          <div style={{
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
            animation: 'pulse 1.5s ease-in-out infinite'
          }} />
        </div>
        {/* Timeline skeleton */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'hidden' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{
              minWidth: '80px',
              height: '90px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
              animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.1}s`
            }} />
          ))}
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
        <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
          Chargement des prévisions...
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
                Le service de prévision MS4 ne répond pas actuellement.
              </p>
              <p style={{ fontSize: '11px', color: '#dc2626', fontFamily: 'monospace' }}>
                {error}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchForecast}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            fontWeight: 600,
            padding: '12px 16px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
          }}
        >
          <RefreshCw size={16} />
          Réessayer
        </button>
      </div>
    );
  }

  if (!forecast || !forecast.points) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
        <CloudRain size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
        <p>Aucune prévision disponible</p>
      </div>
    );
  }

  const currentPoint = forecast.points[selectedDay] || forecast.points[0];
  const stressLevel = currentPoint?.hydric_stress || 0;

  /**
   * Get stress color based on level
   */
  const getStressGradient = (stress) => {
    if (stress > 60) return { start: '#ef4444', end: '#dc2626', bg: '#fef2f2', text: '#7f1d1d' };
    if (stress > 30) return { start: '#f59e0b', end: '#d97706', bg: '#fffbeb', text: '#78350f' };
    return { start: '#10b981', end: '#059669', bg: '#ecfdf5', text: '#064e3b' };
  };

  const getStressLabel = (stress) => {
    if (stress > 60) return 'Critique';
    if (stress > 30) return 'Modéré';
    return 'Optimal';
  };

  const getTrendIcon = (currentIndex) => {
    if (currentIndex === 0 || !forecast.points[currentIndex - 1]) return null;
    const prev = forecast.points[currentIndex - 1].hydric_stress;
    const curr = forecast.points[currentIndex].hydric_stress;
    if (curr > prev + 5) return <TrendingUp size={14} style={{ color: '#ef4444' }} />;
    if (curr < prev - 5) return <TrendingDown size={14} style={{ color: '#10b981' }} />;
    return <Minus size={14} style={{ color: '#6b7280' }} />;
  };

  const colors = getStressGradient(stressLevel);

  // SVG Gauge component
  const StressGauge = ({ value, size = 140 }) => {
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * Math.PI;
    const progress = (value / 100) * circumference;
    
    return (
      <div style={{ position: 'relative', width: size, height: size / 2 + 20 }}>
        <svg width={size} height={size / 2 + 10} style={{ overflow: 'visible' }}>
          {/* Background arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke={`url(#gaugeGradient-${parcelId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference}`}
            style={{ 
              transition: 'stroke-dasharray 0.8s ease-out',
              filter: `drop-shadow(0 2px 4px ${colors.start}40)`
            }}
          />
          <defs>
            <linearGradient id={`gaugeGradient-${parcelId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.start} />
              <stop offset="100%" stopColor={colors.end} />
            </linearGradient>
          </defs>
        </svg>
        {/* Center content */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -20%)',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: 800, 
            color: colors.start,
            lineHeight: 1,
            textShadow: `0 2px 8px ${colors.start}30`
          }}>
            {value.toFixed(0)}%
          </div>
          <div style={{ 
            fontSize: '11px', 
            fontWeight: 600, 
            color: colors.text,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginTop: '2px'
          }}>
            {getStressLabel(value)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* Header with model info */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: '12px',
        padding: '12px 16px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
          }}>
            <CloudRain size={18} color="white" />
          </div>
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '14px', color: '#1e1b4b', margin: 0 }}>
              Prévisions sur {forecast.points.length} jours
            </h4>
            <p style={{ fontSize: '11px', color: '#6366f1', margin: 0, marginTop: '2px' }}>
              Généré {new Date(forecast.generated_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
        <span style={{
          fontSize: '10px',
          padding: '4px 8px',
          background: 'rgba(99, 102, 241, 0.15)',
          color: '#4f46e5',
          borderRadius: '6px',
          fontWeight: 600,
          fontFamily: 'monospace'
        }}>
          {forecast.model}
        </span>
      </div>

      {/* Central Gauge */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <StressGauge value={stressLevel} />
        <p style={{ 
          fontSize: '12px', 
          color: '#6b7280', 
          marginTop: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Droplet size={12} />
          Stress Hydrique Actuel
        </p>
      </div>

      {/* 7-Day Timeline */}
      <div style={{ marginBottom: '16px' }}>
        <h5 style={{ 
          fontSize: '12px', 
          fontWeight: 600, 
          color: '#374151', 
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Calendar size={14} />
          Prévisions journalières
        </h5>
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          overflowX: 'auto',
          paddingBottom: '8px',
          WebkitOverflowScrolling: 'touch'
        }}>
          {forecast.points.map((point, index) => {
            const dayColors = getStressGradient(point.hydric_stress);
            const isSelected = index === selectedDay;
            const date = new Date(point.timestamp);
            
            return (
              <div
                key={index}
                onClick={() => setSelectedDay(index)}
                style={{
                  minWidth: '72px',
                  padding: '10px 8px',
                  borderRadius: '12px',
                  background: isSelected 
                    ? `linear-gradient(135deg, ${dayColors.start} 0%, ${dayColors.end} 100%)`
                    : 'white',
                  border: isSelected ? 'none' : '1.5px solid #e5e7eb',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'center',
                  boxShadow: isSelected 
                    ? `0 4px 14px ${dayColors.start}40`
                    : '0 2px 4px rgba(0,0,0,0.04)',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                <div style={{ 
                  fontSize: '10px', 
                  fontWeight: 600,
                  color: isSelected ? 'rgba(255,255,255,0.85)' : '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px'
                }}>
                  {index === 0 ? "Auj." : date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  color: isSelected ? 'white' : '#374151',
                  fontWeight: 500,
                  marginTop: '2px'
                }}>
                  {date.getDate()}/{date.getMonth() + 1}
                </div>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: 800,
                  color: isSelected ? 'white' : dayColors.start,
                  marginTop: '4px'
                }}>
                  {point.hydric_stress.toFixed(0)}%
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  marginTop: '4px' 
                }}>
                  {!isSelected && getTrendIcon(index)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.bg} 0%, white 100%)`,
        border: `1.5px solid ${colors.start}30`,
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '12px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '12px'
        }}>
          <h5 style={{ 
            fontSize: '14px', 
            fontWeight: 700, 
            color: colors.text,
            margin: 0 
          }}>
            {new Date(currentPoint.timestamp).toLocaleDateString('fr-FR', { 
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </h5>
          {selectedDay === 0 && (
            <span style={{
              fontSize: '10px',
              padding: '3px 8px',
              background: colors.start,
              color: 'white',
              borderRadius: '10px',
              fontWeight: 600
            }}>
              Aujourd'hui
            </span>
          )}
        </div>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Waves size={14} style={{ color: '#3b82f6' }} />
              <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500 }}>Humidité sol</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#1e40af' }}>
              {currentPoint.soil_moisture.toFixed(1)}%
            </div>
          </div>
          
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Droplet size={14} style={{ color: '#0891b2' }} />
              <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500 }}>Irrigation</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#0e7490' }}>
              {currentPoint.irrigation_need_mm.toFixed(1)} <span style={{ fontSize: '12px', fontWeight: 500 }}>mm</span>
            </div>
          </div>
        </div>

        {/* Confidence interval */}
        {currentPoint.confidence && (
          <div style={{
            marginTop: '12px',
            padding: '10px 12px',
            background: 'rgba(0,0,0,0.02)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '11px', color: '#6b7280' }}>Intervalle de confiance</span>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: 600, 
              color: '#374151',
              fontFamily: 'monospace',
              background: 'white',
              padding: '3px 8px',
              borderRadius: '6px'
            }}>
              {currentPoint.confidence.lower.toFixed(1)}% — {currentPoint.confidence.upper.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {forecast.recommendations && forecast.recommendations.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
          border: '1.5px solid #6ee7b7',
          borderRadius: '14px',
          padding: '14px'
        }}>
          <h5 style={{ 
            fontWeight: 700, 
            fontSize: '13px', 
            color: '#065f46', 
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <ThermometerSun size={16} />
            Recommandations
          </h5>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {forecast.recommendations.map((rec, idx) => (
              <li key={idx} style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '8px',
                marginBottom: idx < forecast.recommendations.length - 1 ? '8px' : 0,
                fontSize: '12px',
                color: '#047857'
              }}>
                <span style={{ 
                  width: '18px', 
                  height: '18px', 
                  background: '#10b981', 
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 700,
                  flexShrink: 0
                }}>
                  {idx + 1}
                </span>
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
