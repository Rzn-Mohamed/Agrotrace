/**
 * Composant Sidebar - Panneau latéral d'informations
 * DashboardSIG - AgroTrace-MS
 * 
 * Affiche:
 * - Statistiques globales
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
  BarChart3
} from 'lucide-react';
import { getStats, getAlertes, getRecommandations } from '../../services/api';
import { exportToPDF } from '../../utils/pdfExport';
import './Sidebar.css';

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
        {/* Statistiques globales */}
        {stats && (
          <section className="sidebar-section">
            <h3><Activity size={18} /> Statistiques Globales</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#3498db15', color: '#3498db' }}>
                  <BarChart3 size={20} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.total_parcelles}</div>
                  <div className="stat-label">Parcelles</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#27ae6015', color: '#27ae60' }}>
                  <TrendingUp size={20} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.superficie_totale} ha</div>
                  <div className="stat-label">Superficie</div>
                </div>
              </div>

              <div className="stat-card critical">
                <div className="stat-icon" style={{ background: '#e74c3c15', color: '#e74c3c' }}>
                  <AlertTriangle size={20} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.parcelles_critiques}</div>
                  <div className="stat-label">Critiques</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#f39c1215', color: '#f39c12' }}>
                  <Droplet size={20} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.stress_moyen}</div>
                  <div className="stat-label">Stress moyen</div>
                </div>
              </div>
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
