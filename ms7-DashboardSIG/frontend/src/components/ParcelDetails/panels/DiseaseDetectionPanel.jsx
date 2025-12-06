import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Panel MS3 - Détection des maladies par analyse d'image
 * Permet l'upload d'une photo de feuille et affiche le résultat de l'analyse
 */
const DiseaseDetectionPanel = ({ parcelId }) => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  /**
   * Gestion du drag & drop
   */
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

  /**
   * Gestion de la sélection de fichier
   */
  const handleFileSelect = (file) => {
    if (!file) return;

    // Vérifier que c'est une image
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image (JPG, PNG, etc.)');
      return;
    }

    setUploadedFile(file);
    setResult(null);

    // Créer une preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Simulation de l'analyse (à remplacer par un vrai appel API MS3)
   */
  const analyzeImage = async () => {
    setAnalyzing(true);
    
    // Simuler un délai d'analyse
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Résultat mocké - remplacer par un vrai appel à MS3
    const mockResults = [
      {
        disease: 'Oïdium (Powdery Mildew)',
        confidence: 94.2,
        severity: 'Modérée',
        treatment: 'Application de soufre mouillable ou de bicarbonate de potassium',
        color: 'yellow'
      },
      {
        disease: 'Rouille (Rust)',
        confidence: 89.7,
        severity: 'Faible',
        treatment: 'Retirer les feuilles infectées et appliquer un fongicide à base de cuivre',
        color: 'orange'
      },
      {
        disease: 'Feuille Saine (Healthy)',
        confidence: 96.5,
        severity: 'Aucune',
        treatment: 'Aucun traitement nécessaire',
        color: 'green'
      },
      {
        disease: 'Mildiou (Downy Mildew)',
        confidence: 91.3,
        severity: 'Élevée',
        treatment: 'Traitement préventif avec fongicide systémique',
        color: 'red'
      }
    ];

    // Sélectionner un résultat aléatoire
    const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)];
    
    setResult(randomResult);
    setAnalyzing(false);
  };

  /**
   * Réinitialiser l'analyse
   */
  const resetAnalysis = () => {
    setUploadedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setAnalyzing(false);
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'élevée':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'modérée':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'faible':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
        <h4 className="font-semibold text-green-900 flex items-center gap-2">
          <ImageIcon size={20} />
          Détection de Maladies (MS3)
        </h4>
        <p className="text-xs text-green-700 mt-1">
          Uploadez une photo de feuille pour une analyse par IA
        </p>
      </div>

      {/* Zone d'upload */}
      {!uploadedFile && (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-3 border-dashed rounded-lg p-8 text-center transition-all ${
            isDragging
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 bg-gray-50 hover:border-green-400'
          }`}
        >
          <Upload size={48} className={`mx-auto mb-4 ${isDragging ? 'text-green-500' : 'text-gray-400'}`} />
          <h5 className="text-lg font-semibold text-gray-900 mb-2">
            {isDragging ? 'Déposez votre image ici' : 'Glissez-déposez une image'}
          </h5>
          <p className="text-sm text-gray-600 mb-4">
            ou
          </p>
          <label className="inline-block cursor-pointer bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
            Parcourir les fichiers
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files[0])}
              className="hidden"
            />
          </label>
          <p className="text-xs text-gray-500 mt-3">
            Formats acceptés: JPG, PNG, WEBP (max 10 MB)
          </p>
        </div>
      )}

      {/* Prévisualisation et analyse */}
      {uploadedFile && (
        <div className="space-y-4">
          {/* Image uploadée */}
          <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden">
            <img
              src={previewUrl}
              alt="Feuille à analyser"
              className="w-full h-64 object-cover"
            />
            <button
              onClick={resetAnalysis}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
              title="Supprimer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Bouton d'analyse */}
          {!result && !analyzing && (
            <button
              onClick={analyzeImage}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <ImageIcon size={20} />
              Analyser la feuille
            </button>
          )}

          {/* État d'analyse */}
          {analyzing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mx-auto mb-4"></div>
              <h5 className="font-semibold text-blue-900 text-lg mb-2">Analyse en cours...</h5>
              <p className="text-sm text-blue-700">
                L'intelligence artificielle analyse votre image
              </p>
            </div>
          )}

          {/* Résultat de l'analyse */}
          {result && !analyzing && (
            <div className="space-y-4">
              {/* Badge de confiance */}
              <div className={`border-2 rounded-lg p-4 ${
                result.color === 'green' ? 'bg-green-50 border-green-300' :
                result.color === 'yellow' ? 'bg-yellow-50 border-yellow-300' :
                result.color === 'orange' ? 'bg-orange-50 border-orange-300' :
                'bg-red-50 border-red-300'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-bold text-lg flex items-center gap-2">
                    {result.color === 'green' ? <CheckCircle size={24} className="text-green-600" /> : <AlertCircle size={24} className="text-red-600" />}
                    Résultat de l'analyse
                  </h5>
                  <span className="px-3 py-1 bg-white rounded-full text-sm font-bold">
                    {result.confidence.toFixed(1)}% confiance
                  </span>
                </div>

                <div className="bg-white rounded-lg p-4 mb-3">
                  <p className="text-sm text-gray-600 mb-1">Maladie détectée:</p>
                  <p className="text-2xl font-bold text-gray-900">{result.disease}</p>
                </div>

                <div className={`px-3 py-2 rounded-lg border ${getSeverityColor(result.severity)}`}>
                  <p className="text-sm font-semibold">
                    Sévérité: {result.severity}
                  </p>
                </div>
              </div>

              {/* Recommandations de traitement */}
              {result.treatment && result.severity !== 'Aucune' && (
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                  <h6 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    💊 Traitement recommandé
                  </h6>
                  <p className="text-sm text-blue-800">{result.treatment}</p>
                </div>
              )}

              {result.severity === 'Aucune' && (
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center">
                  <p className="text-green-900 font-semibold">✅ Aucune maladie détectée</p>
                  <p className="text-sm text-green-700 mt-1">La feuille semble en bonne santé</p>
                </div>
              )}

              {/* Nouvelle analyse */}
              <button
                onClick={resetAnalysis}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Analyser une autre image
              </button>
            </div>
          )}
        </div>
      )}

      {/* Note sur MS3 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
        <p className="font-semibold mb-1">ℹ️ À propos de MS3</p>
        <p>
          Ce module utilise le service MS3 (Vision Plante) pour détecter automatiquement les maladies 
          sur les feuilles grâce à l'apprentissage profond (U-Net).
        </p>
      </div>
    </div>
  );
};

export default DiseaseDetectionPanel;
