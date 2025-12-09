/**
 * Composant Sidebar - Panneau latéral d'informations enrichi
 * DashboardSIG - AgroTrace-MS
 * 
 * Affiche:
 * - Widget Météo avec prévisions
 * - Statistiques globales
 * - Moniteur santé système
 * - Timeline d'activités
 * - Liste des alertes
 * - Recommandations d'irrigation
 * - Bouton d'export PDF
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Droplet, 
  TrendingUp, 
  Download,
  RefreshCw,
  BarChart3,
  Sun,
  Cloud,
  CloudRain,
  Wind,
  Thermometer,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  Zap,
  Target,
  Calendar
} from 'lucide-react';
import { getStats, getAlertes, getRecommandations, getMicroservicesHealth } from '../../services/api';
import { exportToPDF } from '../../utils/pdfExport';
import './Sidebar.css';

/**
 * Widget Météo avec animation
 */
const WeatherWidget = () => {
  const [weather, setWeather] = useState({
    temp: 28,
    humidity: 54,
    wind: 12,
    condition: 'sunny',
    forecast: [
      { day: 'Lun', temp: 29, icon: 'sunny' },
      { day: 'Mar', temp: 27, icon: 'cloudy' },
      { day: 'Mer', temp: 25, icon: 'rainy' }
    ]
  });

  const getWeatherIcon = (condition, size = 24) => {
    switch (condition) {
      case 'sunny': return <Sun size={size} />;
      case 'cloudy': return <Cloud size={size} />;
      case 'rainy': return <CloudRain size={size} />;
      default: return <Sun size={size} />;
    }
  };

  const getWeatherGradient = (condition) => {
    switch (condition) {
      case 'sunny': return 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)';
      case 'cloudy': return 'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)';
      case 'rainy': return 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)';
      default: return 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)';
    }
  };

  return (
    <div className="weather-widget" style={{ background: getWeatherGradient(weather.condition) }}>
      <div className="weather-main">
        <div className="weather-icon-large">
          {getWeatherIcon(weather.condition, 48)}
        </div>
        <div className="weather-temp">
          <span className="temp-value">{weather.temp}°</span>
          <span className="temp-unit">C</span>
        </div>
      </div>
      
      <div className="weather-details">
        <div className="weather-detail">
          <Droplet size={14} />
          <span>{weather.humidity}%</span>
        </div>
        <div className="weather-detail">
          <Wind size={14} />
          <span>{weather.wind} km/h</span>
        </div>
      </div>

      <div className="weather-forecast">
        {weather.forecast.map((day, idx) => (
          <div key={idx} className="forecast-day">
            <span className="forecast-label">{day.day}</span>
            {getWeatherIcon(day.icon, 16)}
            <span className="forecast-temp">{day.temp}°</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Moniteur Santé Système
 */
const SystemHealthMonitor = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadHealth = async () => {
    try {
      const data = await getMicroservicesHealth();
      setHealth(data);
    } catch (error) {
      // Fallback to mock data
      setHealth({
        services: [
          { name: 'MS1', label: 'Capteurs', status: 'healthy' },
          { name: 'MS2', label: 'Prétraitement', status: 'healthy' },
          { name: 'MS3', label: 'Vision IA', status: 'healthy' },
          { name: 'MS4', label: 'Prévisions', status: 'healthy' },
          { name: 'MS5', label: 'Règles Agro', status: 'healthy' },
          { name: 'MS6', label: 'Irrigation IA', status: 'warning' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle size={14} />;
      case 'warning': return <AlertTriangle size={14} />;
      case 'error': return <XCircle size={14} />;
      default: return <Loader size={14} className="spinning" />;
    }
  };

  if (loading) {
    return (
      <div className="system-health">
        <div className="health-loading">
          <Loader size={16} className="spinning" />
        </div>
      </div>
    );
  }

  return (
    <div className="system-health">
      <div className="health-grid">
        {health?.services?.map((service, idx) => (
          <div 
            key={idx} 
            className={`health-item status-${service.status}`}
            title={`${service.label}: ${service.status}`}
          >
            <div className="health-indicator">
              {getStatusIcon(service.status)}
            </div>
            <span className="health-label">{service.name}</span>
          </div>
        ))}
      </div>
      <div className="health-footer">
        <Clock size={12} />
        <span>Dernière MAJ: {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
};

/**
 * Timeline d'Activités
 */
const ActivityTimeline = () => {
  const [activities] = useState([
    { 
      id: 1, 
      type: 'irrigation', 
      message: 'Irrigation terminée - Parcel Alpha', 
      time: '10:30',
      icon: 'droplet'
    },
    { 
      id: 2, 
      type: 'alert', 
      message: 'Stress hydrique détecté - Parcel Beta', 
      time: '09:15',
      icon: 'alert'
    },
    { 
      id: 3, 
      type: 'analysis', 
      message: 'Analyse IA complète - Parcel Gamma', 
      time: '08:45',
      icon: 'target'
    },
    { 
      id: 4, 
      type: 'sensor', 
      message: 'Capteurs calibrés - Zone Nord', 
      time: '08:00',
      icon: 'zap'
    }
  ]);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'irrigation': return <Droplet size={14} />;
      case 'alert': return <AlertTriangle size={14} />;
      case 'analysis': return <Target size={14} />;
      case 'sensor': return <Zap size={14} />;
      default: return <Activity size={14} />;
    }
  };

  return (
    <div className="activity-timeline">
      {activities.map((activity, idx) => (
        <div 
          key={activity.id} 
          className={`timeline-item type-${activity.type}`}
          style={{ animationDelay: `${idx * 0.1}s` }}
        >
          <div className="timeline-dot">
            {getActivityIcon(activity.type)}
          </div>
          <div className="timeline-content">
            <p className="timeline-message">{activity.message}</p>
            <span className="timeline-time">
              <Clock size={10} />
              {activity.time}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Stat Card avec animation
 */
const AnimatedStatCard = ({ icon, value, label, color, isCritical }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const numValue = parseFloat(value) || 0;
    const duration = 1000;
    const steps = 30;
    const increment = numValue / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= numValue) {
        setDisplayValue(numValue);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const formatValue = (val) => {
    if (typeof value === 'string' && value.includes('.')) {
      return val.toFixed(2);
    }
    return Math.round(val);
  };

  return (
    <div className={`stat-card ${isCritical ? 'critical' : ''}`}>
      <div className="stat-icon" style={{ background: `${color}15`, color: color }}>
        {icon}
      </div>
      <div className="stat-content">
        <div className="stat-value">
          {formatValue(displayValue)}
          {typeof value === 'string' && value.includes('ha') ? ' ha' : ''}
        </div>
        <div className="stat-label">{label}</div>
      </div>
      {isCritical && <div className="stat-pulse"></div>}
    </div>
  );
};

const Sidebar = ({ selectedParcelle }) => {
  const [stats, setStats] = useState(null);
  const [alertes, setAlertes] = useState([]);
  const [recommandations, setRecommandations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  /**
   * Charge toutes les données de la sidebar
   */
  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, alertesData, recosData] = await Promise.all([
        getStats(),
        getAlertes(),
        getRecommandations()
      ]);

      setStats(statsData);
      setAlertes(alertesData.alertes || []);
      setRecommandations(recosData.recommandations || []);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Rafraîchit les données
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setTimeout(() => setRefreshing(false), 500);
  };

  /**
   * Exporte le rapport en PDF
   */
  const handleExport = async () => {
    try {
      await exportToPDF(stats, alertes, recommandations, selectedParcelle);
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('Erreur lors de la génération du PDF');
    }
  };

  if (loading) {
    return (
      <div className="sidebar">
        <div className="sidebar-loading">
          <div className="spinner-small"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar">
      {/* Header avec actions */}
      <div className="sidebar-header">
        <h2><BarChart3 size={24} /> Tableau de Bord</h2>
        <div className="sidebar-actions">
          <button 
            className="action-btn refresh-btn" 
            onClick={handleRefresh}
            disabled={refreshing}
            title="Rafraîchir les données"
          >
            <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
          </button>
          <button 
            className="action-btn export-btn" 
            onClick={handleExport}
            title="Exporter en PDF"
          >
            <Download size={18} />
            <span>PDF</span>
          </button>
        </div>
      </div>

      <div className="sidebar-content">
        {/* Widget Météo */}
        <section className="sidebar-section weather-section">
          <WeatherWidget />
        </section>

        {/* Statistiques globales */}
        {stats && (
          <section className="sidebar-section">
            <h3><Activity size={18} /> Statistiques Globales</h3>
            <div className="stats-grid">
              <AnimatedStatCard 
                icon={<BarChart3 size={20} />}
                value={stats.total_parcelles}
                label="Parcelles"
                color="#3498db"
              />
              <AnimatedStatCard 
                icon={<TrendingUp size={20} />}
                value={`${stats.superficie_totale}`}
                label="Hectares"
                color="#27ae60"
              />
              <AnimatedStatCard 
                icon={<AlertTriangle size={20} />}
                value={stats.parcelles_critiques}
                label="Critiques"
                color="#e74c3c"
                isCritical={stats.parcelles_critiques > 0}
              />
              <AnimatedStatCard 
                icon={<Droplet size={20} />}
                value={stats.stress_moyen}
                label="Stress moy."
                color="#f39c12"
              />
            </div>

            {/* Répartition des parcelles */}
            <div className="distribution">
              <h4>Répartition par état</h4>
              <div className="distribution-bars">
                <div className="distribution-item">
                  <div className="distribution-label">
                    <span className="dot" style={{ background: '#e74c3c' }}></span>
                    <span>Critique</span>
                  </div>
                  <div className="distribution-bar">
                    <div 
                      className="distribution-fill"
                      style={{ 
                        width: `${(stats.parcelles_critiques / stats.total_parcelles * 100)}%`,
                        background: '#e74c3c'
                      }}
                    ></div>
                  </div>
                  <span className="distribution-count">{stats.parcelles_critiques}</span>
                </div>

                <div className="distribution-item">
                  <div className="distribution-label">
                    <span className="dot" style={{ background: '#f39c12' }}></span>
                    <span>Modéré</span>
                  </div>
                  <div className="distribution-bar">
                    <div 
                      className="distribution-fill"
                      style={{ 
                        width: `${(stats.parcelles_moderees / stats.total_parcelles * 100)}%`,
                        background: '#f39c12'
                      }}
                    ></div>
                  </div>
                  <span className="distribution-count">{stats.parcelles_moderees}</span>
                </div>

                <div className="distribution-item">
                  <div className="distribution-label">
                    <span className="dot" style={{ background: '#27ae60' }}></span>
                    <span>OK</span>
                  </div>
                  <div className="distribution-bar">
                    <div 
                      className="distribution-fill"
                      style={{ 
                        width: `${(stats.parcelles_ok / stats.total_parcelles * 100)}%`,
                        background: '#27ae60'
                      }}
                    ></div>
                  </div>
                  <span className="distribution-count">{stats.parcelles_ok}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Moniteur Santé Système */}
        <section className="sidebar-section">
          <h3><Zap size={18} /> Santé Système</h3>
          <SystemHealthMonitor />
        </section>

        {/* Timeline d'activités */}
        <section className="sidebar-section">
          <h3><Calendar size={18} /> Activités Récentes</h3>
          <ActivityTimeline />
        </section>

        {/* Alertes maladies */}
        <section className="sidebar-section">
          <h3>
            <AlertTriangle size={18} /> 
            Alertes Actives 
            {alertes.length > 0 && <span className="badge badge-danger">{alertes.length}</span>}
          </h3>
          
          {alertes.length === 0 ? (
            <div className="empty-state">
              <p>✅ Aucune alerte active</p>
            </div>
          ) : (
            <div className="alertes-mini-list">
              {alertes.slice(0, 5).map((alerte) => (
                <div key={alerte.id} className={`alert-mini severite-${alerte.severite?.toLowerCase()}`}>
                  <div className="alert-mini-header">
                    <span className="alert-mini-parcelle">{alerte.parcelle.nom}</span>
                    <span className={`alert-mini-badge severite-${alerte.severite?.toLowerCase()}`}>
                      {alerte.severite}
                    </span>
                  </div>
                  <div className="alert-mini-disease">{alerte.type_maladie}</div>
                </div>
              ))}
              {alertes.length > 5 && (
                <div className="show-more">+{alertes.length - 5} autres alertes</div>
              )}
            </div>
          )}
        </section>

        {/* Recommandations */}
        <section className="sidebar-section">
          <h3>
            <Droplet size={18} /> 
            Recommandations 
            {recommandations.length > 0 && <span className="badge badge-info">{recommandations.length}</span>}
          </h3>

          {recommandations.length === 0 ? (
            <div className="empty-state">
              <p>✅ Aucune recommandation en attente</p>
            </div>
          ) : (
            <div className="recos-mini-list">
              {recommandations.slice(0, 5).map((reco) => (
                <div key={reco.id} className={`reco-mini priorite-${reco.priorite?.toLowerCase()}`}>
                  <div className="reco-mini-header">
                    <span className="reco-mini-parcelle">{reco.parcelle.nom}</span>
                    <span className={`reco-mini-badge priorite-${reco.priorite?.toLowerCase()}`}>
                      {reco.priorite}
                    </span>
                  </div>
                  <div className="reco-mini-details">
                    <Droplet size={14} />
                    <span>{reco.volume_mm} mm - {reco.duree_minutes} min</span>
                  </div>
                </div>
              ))}
              {recommandations.length > 5 && (
                <div className="show-more">+{recommandations.length - 5} autres recommandations</div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Sidebar;
