/**
 * Utilitaire d'export PDF
 * Génère des rapports PDF avec jsPDF
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Exporte un rapport PDF complet
 */
export const exportToPDF = async (stats, alertes, recommandations, selectedParcelle = null) => {
  const doc = new jsPDF();
  
  // Configuration
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // ============================================================================
  // HEADER
  // ============================================================================
  
  // Logo / Titre
  doc.setFillColor(102, 126, 234);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('AgroTrace-MS', 20, 20);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('DashboardSIG - Rapport d\'Activité', 20, 28);
  
  yPosition = 45;

  // Date de génération
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Généré le ${dateStr}`, 20, yPosition);
  yPosition += 15;

  // ============================================================================
  // STATISTIQUES GLOBALES
  // ============================================================================
  
  if (stats) {
    doc.setTextColor(44, 62, 80);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 Statistiques Globales', 20, yPosition);
    yPosition += 10;

    // Tableau des statistiques
    doc.autoTable({
      startY: yPosition,
      head: [['Indicateur', 'Valeur']],
      body: [
        ['Nombre total de parcelles', stats.total_parcelles?.toString() || 'N/A'],
        ['Superficie totale', `${stats.superficie_totale || 0} ha`],
        ['Parcelles en état critique', stats.parcelles_critiques?.toString() || '0'],
        ['Parcelles en état modéré', stats.parcelles_moderees?.toString() || '0'],
        ['Parcelles en bon état', stats.parcelles_ok?.toString() || '0'],
        ['Stress hydrique moyen', stats.stress_moyen?.toString() || 'N/A'],
        ['Alertes maladies actives', stats.total_alertes?.toString() || '0'],
        ['Recommandations en attente', stats.total_recommandations?.toString() || '0'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [102, 126, 234], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 70, fontStyle: 'bold' }
      }
    });

    yPosition = doc.lastAutoTable.finalY + 15;
  }

  // ============================================================================
  // PARCELLE SÉLECTIONNÉE (si applicable)
  // ============================================================================
  
  if (selectedParcelle) {
    // Nouvelle page si nécessaire
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`🌾 Détails: ${selectedParcelle.nom}`, 20, yPosition);
    yPosition += 10;

    doc.autoTable({
      startY: yPosition,
      head: [['Propriété', 'Valeur']],
      body: [
        ['Culture', selectedParcelle.culture],
        ['Superficie', `${selectedParcelle.superficie_ha} ha`],
        ['Date semis', new Date(selectedParcelle.date_semis).toLocaleDateString('fr-FR')],
        ['État hydrique', selectedParcelle.stress_hydrique],
        ['Niveau de stress', `${(selectedParcelle.niveau_stress * 100).toFixed(0)}%`],
        ['Besoin en eau', `${selectedParcelle.besoin_eau_mm} mm`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 5 }
    });

    yPosition = doc.lastAutoTable.finalY + 15;
  }

  // ============================================================================
  // ALERTES MALADIES
  // ============================================================================
  
  if (alertes && alertes.length > 0) {
    // Nouvelle page si nécessaire
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`⚠️ Alertes Maladies (${alertes.length})`, 20, yPosition);
    yPosition += 10;

    const alertesData = alertes.map(a => [
      a.parcelle?.nom || 'N/A',
      a.type_maladie,
      a.severite,
      `${(a.confiance * 100).toFixed(0)}%`,
      new Date(a.date_detection).toLocaleDateString('fr-FR')
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['Parcelle', 'Maladie', 'Sévérité', 'Confiance', 'Date']],
      body: alertesData,
      theme: 'striped',
      headStyles: { fillColor: [231, 76, 60], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        2: { 
          cellWidth: 25,
          fontStyle: 'bold'
        }
      },
      didParseCell: function(data) {
        // Colorer selon la sévérité
        if (data.column.index === 2 && data.section === 'body') {
          const severite = data.cell.raw;
          if (severite === 'ELEVEE') {
            data.cell.styles.textColor = [231, 76, 60];
          } else if (severite === 'MOYENNE') {
            data.cell.styles.textColor = [243, 156, 18];
          } else {
            data.cell.styles.textColor = [52, 152, 219];
          }
        }
      }
    });

    yPosition = doc.lastAutoTable.finalY + 15;
  }

  // ============================================================================
  // RECOMMANDATIONS D'IRRIGATION
  // ============================================================================
  
  if (recommandations && recommandations.length > 0) {
    // Nouvelle page si nécessaire
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`💧 Recommandations d'Irrigation (${recommandations.length})`, 20, yPosition);
    yPosition += 10;

    const recosData = recommandations.map(r => [
      r.parcelle?.nom || 'N/A',
      `${r.volume_mm} mm`,
      `${r.duree_minutes} min`,
      r.heure_optimale || 'N/A',
      r.priorite,
      new Date(r.date_recommandation).toLocaleDateString('fr-FR')
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['Parcelle', 'Volume', 'Durée', 'Heure', 'Priorité', 'Date']],
      body: recosData,
      theme: 'striped',
      headStyles: { fillColor: [52, 152, 219], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        4: { 
          fontStyle: 'bold'
        }
      },
      didParseCell: function(data) {
        // Colorer selon la priorité
        if (data.column.index === 4 && data.section === 'body') {
          const priorite = data.cell.raw;
          if (priorite === 'URGENTE') {
            data.cell.styles.textColor = [231, 76, 60];
          } else if (priorite === 'HAUTE') {
            data.cell.styles.textColor = [243, 156, 18];
          } else if (priorite === 'NORMALE') {
            data.cell.styles.textColor = [52, 152, 219];
          }
        }
      }
    });

    yPosition = doc.lastAutoTable.finalY + 15;
  }

  // ============================================================================
  // FOOTER
  // ============================================================================
  
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} sur ${pageCount} | AgroTrace-MS - DashboardSIG`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // ============================================================================
  // SAUVEGARDE
  // ============================================================================
  
  const filename = `AgroTrace_Rapport_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);

  console.log(`✅ Rapport PDF généré: ${filename}`);
};

export default exportToPDF;
