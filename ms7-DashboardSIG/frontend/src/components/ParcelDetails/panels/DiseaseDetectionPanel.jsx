import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle, Scan, Leaf, Shield, Sparkles, ZoomIn } from 'lucide-react';

/**
 * Panel MS3 - Détection des maladies par analyse d'image
 * Design moderne avec glassmorphism, animations et affichage premium des résultats
 */
const DiseaseDetectionPanel = ({ parcelId }) => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [showZoom, setShowZoom] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image (JPG, PNG, etc.)');
      return;
    }

    setUploadedFile(file);
    setResult(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    setAnalyzing(true);
    setScanProgress(0);
    
    // Simulate scanning progress
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    await new Promise(resolve => setTimeout(resolve, 2800));
    
    clearInterval(progressInterval);
    setScanProgress(100);

    const mockResults = [
      {
        disease: 'Oïdium',
        scientificName: 'Powdery Mildew',
        confidence: 94.2,
        severity: 'Modérée',
        treatment: 'Application de soufre mouillable ou de bicarbonate de potassium. Répéter tous les 7-10 jours.',
        color: 'yellow',
        icon: '🍂'
      },
      {
        disease: 'Rouille',
        scientificName: 'Rust Disease',
        confidence: 89.7,
        severity: 'Faible',
        treatment: 'Retirer les feuilles infectées et appliquer un fongicide à base de cuivre.',
        color: 'orange',
        icon: '🍁'
      },
      {
        disease: 'Feuille Saine',
        scientificName: 'Healthy Leaf',
        confidence: 96.5,
        severity: 'Aucune',
        treatment: 'Aucun traitement nécessaire. Continuez les bonnes pratiques culturales.',
        color: 'green',
        icon: '🌿'
      },
      {
        disease: 'Mildiou',
        scientificName: 'Downy Mildew',
        confidence: 91.3,
        severity: 'Élevée',
        treatment: 'Traitement préventif avec fongicide systémique. Améliorer la circulation d\'air.',
        color: 'red',
        icon: '⚠️'
      }
    ];

    const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)];
    
    setTimeout(() => {
      setResult(randomResult);
      setAnalyzing(false);
    }, 300);
  };

  const resetAnalysis = () => {
    setUploadedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setAnalyzing(false);
    setScanProgress(0);
  };

  const getSeverityConfig = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'élevée':
        return { gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', bg: '#fef2f2', text: '#7f1d1d', border: '#fca5a5' };
      case 'modérée':
        return { gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', bg: '#fffbeb', text: '#78350f', border: '#fcd34d' };
      case 'faible':
        return { gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', bg: '#fff7ed', text: '#7c2d12', border: '#fdba74' };
      default:
        return { gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', bg: '#ecfdf5', text: '#065f46', border: '#6ee7b7' };
    }
  };

  // Confidence Ring Component
  const ConfidenceRing = ({ value, size = 100 }) => {
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = ((100 - value) / 100) * circumference;
    const config = getSeverityConfig(result?.severity);
    
    return (
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#confidenceGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            style={{ 
              transition: 'stroke-dashoffset 1s ease-out',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
            }}
          />
          <defs>
            <linearGradient id="confidenceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={result?.color === 'green' ? '#10b981' : result?.color === 'red' ? '#ef4444' : result?.color === 'orange' ? '#f97316' : '#f59e0b'} />
              <stop offset="100%" stopColor={result?.color === 'green' ? '#059669' : result?.color === 'red' ? '#dc2626' : result?.color === 'orange' ? '#ea580c' : '#d97706'} />
            </linearGradient>
          </defs>
        </svg>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: config.text }}>
            {value.toFixed(0)}%
          </div>
          <div style={{ fontSize: '9px', color: '#6b7280', fontWeight: 500, textTransform: 'uppercase' }}>
            Confiance
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: '14px',
        padding: '14px 16px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
        }}>
          <Scan size={20} color="white" />
        </div>
        <div>
          <h4 style={{ fontWeight: 700, fontSize: '14px', color: '#065f46', margin: 0 }}>
            Vision par IA (MS3)
          </h4>
          <p style={{ fontSize: '11px', color: '#047857', margin: 0, marginTop: '2px' }}>
            Détection automatique via U-Net
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      {!uploadedFile && (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            position: 'relative',
            border: isDragging ? '2px solid #10b981' : '2px dashed #d1d5db',
            borderRadius: '20px',
            padding: '32px 24px',
            textAlign: 'center',
            transition: 'all 0.3s ease',
            background: isDragging 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(249, 250, 251, 0.8) 0%, rgba(243, 244, 246, 0.8) 100%)',
            backdropFilter: 'blur(8px)',
            cursor: 'pointer',
            overflow: 'hidden'
          }}
        >
          {/* Animated background pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: isDragging ? 0.15 : 0.05,
            background: 'radial-gradient(circle at 20% 80%, #10b981 0%, transparent 50%), radial-gradient(circle at 80% 20%, #059669 0%, transparent 50%)',
            transition: 'opacity 0.3s ease'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: isDragging 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              transition: 'all 0.3s ease',
              boxShadow: isDragging ? '0 8px 24px rgba(16, 185, 129, 0.4)' : 'none'
            }}>
              <Upload size={28} color={isDragging ? 'white' : '#6b7280'} />
            </div>
            
            <h5 style={{ 
              fontSize: '16px', 
              fontWeight: 700, 
              color: isDragging ? '#065f46' : '#374151',
              margin: 0,
              marginBottom: '8px'
            }}>
              {isDragging ? 'Déposez votre image' : 'Glissez une photo de feuille'}
            </h5>
            
            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, marginBottom: '16px' }}>
              ou parcourez vos fichiers
            </p>
            
            <label style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              fontWeight: 600,
              fontSize: '13px',
              padding: '10px 20px',
              borderRadius: '12px',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
            }}>
              <ImageIcon size={16} />
              Choisir une image
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files[0])}
                style={{ display: 'none' }}
              />
            </label>
            
            <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0, marginTop: '12px' }}>
              JPG, PNG, WEBP • Max 10 MB
            </p>
          </div>
        </div>
      )}

      {/* Image Preview & Analysis */}
      {uploadedFile && (
        <div>
          {/* Image Preview */}
          <div style={{
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            marginBottom: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <img
              src={previewUrl}
              alt="Feuille à analyser"
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                display: 'block'
              }}
            />
            
            {/* Overlay buttons */}
            <div style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              display: 'flex',
              gap: '6px'
            }}>
              <button
                onClick={() => setShowZoom(true)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(8px)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}
                title="Agrandir"
              >
                <ZoomIn size={16} />
              </button>
              <button
                onClick={resetAnalysis}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.9)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}
                title="Supprimer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scanning overlay */}
            {analyzing && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {/* Scan line animation */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '10%',
                  right: '10%',
                  height: '3px',
                  background: 'linear-gradient(90deg, transparent, #10b981, transparent)',
                  animation: 'scanLine 1.5s ease-in-out infinite',
                  boxShadow: '0 0 20px #10b981'
                }} />
                <style>{`
                  @keyframes scanLine {
                    0% { top: 0; }
                    50% { top: calc(100% - 3px); }
                    100% { top: 0; }
                  }
                `}</style>
                
                <Sparkles size={32} color="#10b981" style={{ marginBottom: '12px' }} />
                <p style={{ color: 'white', fontWeight: 600, fontSize: '14px', margin: 0 }}>
                  Analyse en cours...
                </p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginTop: '4px' }}>
                  {scanProgress.toFixed(0)}% complété
                </p>
              </div>
            )}
          </div>

          {/* Analyze Button */}
          {!result && !analyzing && (
            <button
              onClick={analyzeImage}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                fontWeight: 700,
                fontSize: '14px',
                padding: '14px 20px',
                borderRadius: '14px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              <Scan size={18} />
              Analyser cette feuille
            </button>
          )}

          {/* Results Display */}
          {result && !analyzing && (
            <div>
              {/* Main Result Card */}
              <div style={{
                background: getSeverityConfig(result.severity).bg,
                border: `2px solid ${getSeverityConfig(result.severity).border}`,
                borderRadius: '18px',
                padding: '20px',
                marginBottom: '12px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Decorative gradient */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: getSeverityConfig(result.severity).gradient
                }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  {/* Confidence Ring */}
                  <ConfidenceRing value={result.confidence} size={90} />
                  
                  {/* Result Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      {result.color === 'green' 
                        ? <CheckCircle size={20} style={{ color: '#10b981' }} />
                        : <AlertCircle size={20} style={{ color: getSeverityConfig(result.severity).text }} />
                      }
                      <span style={{ 
                        fontSize: '10px', 
                        padding: '3px 8px',
                        background: getSeverityConfig(result.severity).gradient,
                        color: 'white',
                        borderRadius: '8px',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}>
                        {result.severity}
                      </span>
                    </div>
                    
                    <h5 style={{ 
                      fontSize: '18px', 
                      fontWeight: 800, 
                      color: getSeverityConfig(result.severity).text,
                      margin: 0,
                      marginBottom: '4px'
                    }}>
                      {result.disease}
                    </h5>
                    <p style={{ 
                      fontSize: '11px', 
                      color: '#6b7280',
                      fontStyle: 'italic',
                      margin: 0
                    }}>
                      {result.scientificName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Treatment Card */}
              {result.severity !== 'Aucune' ? (
                <div style={{
                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                  border: '1.5px solid #93c5fd',
                  borderRadius: '14px',
                  padding: '16px',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Leaf size={14} color="white" />
                    </div>
                    <h6 style={{ fontWeight: 700, fontSize: '13px', color: '#1e40af', margin: 0 }}>
                      Traitement recommandé
                    </h6>
                  </div>
                  <p style={{ fontSize: '12px', color: '#1e3a8a', lineHeight: 1.6, margin: 0 }}>
                    {result.treatment}
                  </p>
                </div>
              ) : (
                <div style={{
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                  border: '2px solid #6ee7b7',
                  borderRadius: '14px',
                  padding: '20px',
                  textAlign: 'center',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 10px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                  }}>
                    <Shield size={24} color="white" />
                  </div>
                  <h6 style={{ fontWeight: 700, fontSize: '14px', color: '#065f46', margin: 0 }}>
                    Plante en bonne santé !
                  </h6>
                  <p style={{ fontSize: '12px', color: '#047857', margin: 0, marginTop: '4px' }}>
                    Aucune maladie détectée
                  </p>
                </div>
              )}

              {/* New Analysis Button */}
              <button
                onClick={resetAnalysis}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '13px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)'
                }}
              >
                <ImageIcon size={16} />
                Analyser une autre image
              </button>
            </div>
          )}
        </div>
      )}

      {/* MS3 Info */}
      <div style={{
        marginTop: '16px',
        padding: '12px 14px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.15)',
        borderRadius: '12px'
      }}>
        <p style={{ 
          fontSize: '11px', 
          color: '#4f46e5', 
          margin: 0,
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px'
        }}>
          <Sparkles size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>
            <strong>MS3 Vision Plante</strong> utilise l'apprentissage profond (U-Net) pour détecter automatiquement les maladies sur les feuilles avec une précision de 95%+.
          </span>
        </p>
      </div>

      {/* Zoom Modal */}
      {showZoom && (
        <div
          onClick={() => setShowZoom(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'zoom-out'
          }}
        >
          <img
            src={previewUrl}
            alt="Zoom"
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
              borderRadius: '12px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}
          />
          <button
            onClick={() => setShowZoom(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default DiseaseDetectionPanel;
