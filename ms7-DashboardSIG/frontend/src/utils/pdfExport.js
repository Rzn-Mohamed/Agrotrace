/**
 * Utilitaire d'export PDF
 * Génère des rapports PDF avec jsPDF
 * Design premium avec mise en page améliorée
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { getParcelles, getParcelleById } from '../services/api';

/**
 * Exporte un rapport PDF complet avec toutes les parcelles
 */
export const exportToPDF = async (stats, alertes, recommandations, selectedParcelle = null) => {
  const doc = new jsPDF();
  
  // Configuration
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Colors
  const primaryColor = [102, 126, 234];
  const successColor = [39, 174, 96];
  const warningColor = [243, 156, 18];
  const dangerColor = [231, 76, 60];
  const infoColor = [52, 152, 219];

  // ============================================================================
  // HEADER - Page 1
  // ============================================================================
  
  // Gradient header background
  doc.setFillColor(102, 126, 234);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Secondary gradient overlay
  doc.setFillColor(118, 75, 162);
  doc.rect(0, 35, pageWidth, 10, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('AgroTrace-MS', 20, 22);
  
  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Dashboard SIG - Rapport Complet des Parcelles', 20, 32);
  
  // Date badge
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth - 75, 12, 60, 18, 3, 3, 'F');
  doc.setTextColor(102, 126, 234);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  doc.text(dateStr, pageWidth - 45, 23, { align: 'center' });

  yPosition = 60;

  // ============================================================================
  // FETCH PARCEL DATA FIRST
  // ============================================================================
  
  let parcelles = [];
  try {
    const parcellesGeoJSON = await getParcelles();
    if (parcellesGeoJSON && parcellesGeoJSON.features) {
      parcelles = parcellesGeoJSON.features;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des parcelles:', error);
  }

  // ============================================================================
  // SUMMARY CARDS - First page
  // ============================================================================
  
  // Summary section title
  doc.setTextColor(44, 62, 80);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Résumé du Rapport', 20, yPosition);
  yPosition += 12;

  // Stats cards row
  const cardWidth = 42;
  const cardHeight = 35;
  const cardGap = 5;
  const startX = 15;

  // Card 1 - Total Parcelles
  doc.setFillColor(52, 152, 219);
  doc.roundedRect(startX, yPosition, cardWidth, cardHeight, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(parcelles.length.toString(), startX + cardWidth/2, yPosition + 18, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Parcelles', startX + cardWidth/2, yPosition + 28, { align: 'center' });

  // Card 2 - Superficie
  const totalSuperficie = parcelles.reduce((sum, p) => sum + (parseFloat(p.properties?.superficie) || 0), 0);
  doc.setFillColor(39, 174, 96);
  doc.roundedRect(startX + cardWidth + cardGap, yPosition, cardWidth, cardHeight, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(totalSuperficie.toFixed(1), startX + cardWidth + cardGap + cardWidth/2, yPosition + 18, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Hectares', startX + cardWidth + cardGap + cardWidth/2, yPosition + 28, { align: 'center' });

  // Card 3 - Critiques
  const critiques = parcelles.filter(p => p.properties?.stress_hydrique === 'CRITIQUE').length;
  doc.setFillColor(231, 76, 60);
  doc.roundedRect(startX + (cardWidth + cardGap) * 2, yPosition, cardWidth, cardHeight, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(critiques.toString(), startX + (cardWidth + cardGap) * 2 + cardWidth/2, yPosition + 18, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Critiques', startX + (cardWidth + cardGap) * 2 + cardWidth/2, yPosition + 28, { align: 'center' });

  // Card 4 - OK
  const okCount = parcelles.filter(p => p.properties?.stress_hydrique === 'OK').length;
  doc.setFillColor(46, 204, 113);
  doc.roundedRect(startX + (cardWidth + cardGap) * 3, yPosition, cardWidth, cardHeight, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(okCount.toString(), startX + (cardWidth + cardGap) * 3 + cardWidth/2, yPosition + 18, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('OK', startX + (cardWidth + cardGap) * 3 + cardWidth/2, yPosition + 28, { align: 'center' });

  yPosition += cardHeight + 20;

  // ============================================================================
  // PARCEL INVENTORY TABLE - Same page
  // ============================================================================
  
  if (parcelles.length > 0) {
    doc.setTextColor(44, 62, 80);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Inventaire des Parcelles', 20, yPosition);
    yPosition += 8;

    const parcellesData = parcelles.map((feature, index) => {
      const p = feature.properties;
      return [
        index + 1,
        p.nom || 'N/A',
        p.culture || 'N/A',
        p.superficie ? `${p.superficie} ha` : 'N/A',
        p.stress_hydrique || 'N/A'
      ];
    });

    doc.autoTable({
      startY: yPosition,
      head: [['#', 'Nom', 'Culture', 'Superficie', 'État']],
      body: parcellesData,
      theme: 'grid',
      headStyles: { 
        fillColor: primaryColor, 
        textColor: 255, 
        fontStyle: 'bold',
        fontSize: 10,
        cellPadding: 4
      },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
        3: { cellWidth: 30, halign: 'center' },
        4: { cellWidth: 25, halign: 'center', fontStyle: 'bold' }
      },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      didParseCell: function(data) {
        if (data.column.index === 4 && data.section === 'body') {
          const etat = data.cell.raw;
          if (etat === 'CRITIQUE') {
            data.cell.styles.textColor = dangerColor;
          } else if (etat === 'MODERE') {
            data.cell.styles.textColor = warningColor;
          } else if (etat === 'OK') {
            data.cell.styles.textColor = successColor;
          }
        }
      }
    });

    yPosition = doc.lastAutoTable.finalY + 20;
  }

  // ============================================================================
  // DETAILED PARCEL CARDS
  // ============================================================================
  
  if (parcelles.length > 0) {
    // New page for detailed cards
    doc.addPage();
    yPosition = 20;

    // Section header
    doc.setFillColor(102, 126, 234);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Fiches Détaillées des Parcelles', 20, 16);
    
    yPosition = 35;

    for (let i = 0; i < parcelles.length; i++) {
      const feature = parcelles[i];
      const parcelId = feature.properties.id;
      const p = feature.properties;

      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        // Mini header for continuation pages
        doc.setFillColor(102, 126, 234);
        doc.rect(0, 0, pageWidth, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text('Fiches Détaillées (suite)', 20, 10);
        yPosition = 25;
      }

      // Fetch detailed data
      let parcelDetails = null;
      try {
        parcelDetails = await getParcelleById(parcelId);
      } catch (error) {
        console.log(`Détails non disponibles pour parcelle ${parcelId}`);
      }

      // Card background
      const cardStartY = yPosition;
      const statusColor = p.stress_hydrique === 'CRITIQUE' ? dangerColor : 
                         p.stress_hydrique === 'MODERE' ? warningColor : successColor;
      
      // Status indicator bar
      doc.setFillColor(...statusColor);
      doc.rect(15, yPosition, 4, 50, 'F');
      
      // Card border
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.rect(15, yPosition, pageWidth - 30, 50, 'S');

      // Parcel name header
      doc.setFillColor(250, 250, 252);
      doc.rect(19, yPosition, pageWidth - 34, 12, 'F');
      
      doc.setTextColor(44, 62, 80);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${i + 1}. ${p.nom || 'Parcelle sans nom'}`, 25, yPosition + 8);
      
      // Status badge
      doc.setFillColor(...statusColor);
      doc.roundedRect(pageWidth - 45, yPosition + 2, 25, 8, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.text(p.stress_hydrique || 'N/A', pageWidth - 32.5, yPosition + 7, { align: 'center' });

      // Details grid
      yPosition += 16;
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      const details = parcelDetails || p;
      const col1X = 25;
      const col2X = 110;

      // Row 1
      doc.text('Culture:', col1X, yPosition);
      doc.setTextColor(44, 62, 80);
      doc.setFont('helvetica', 'bold');
      doc.text(details.culture || p.culture || 'N/A', col1X + 25, yPosition);
      
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text('Superficie:', col2X, yPosition);
      doc.setTextColor(44, 62, 80);
      doc.setFont('helvetica', 'bold');
      const superficie = details.superficie_ha || p.superficie || 'N/A';
      doc.text(`${superficie} ha`, col2X + 27, yPosition);

      yPosition += 8;

      // Row 2
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text('Stress:', col1X, yPosition);
      doc.setTextColor(44, 62, 80);
      doc.setFont('helvetica', 'bold');
      const niveau = details.niveau_stress !== undefined ? `${(details.niveau_stress * 100).toFixed(0)}%` : 'N/A';
      doc.text(niveau, col1X + 25, yPosition);
      
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text('Besoin eau:', col2X, yPosition);
      doc.setTextColor(44, 62, 80);
      doc.setFont('helvetica', 'bold');
      const besoin = details.besoin_eau_mm !== undefined ? `${details.besoin_eau_mm} mm` : 'N/A';
      doc.text(besoin, col2X + 27, yPosition);

      yPosition += 8;

      // Row 3
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text('Humidité sol:', col1X, yPosition);
      doc.setTextColor(44, 62, 80);
      doc.setFont('helvetica', 'bold');
      const humidite = details.humidite_sol !== undefined ? `${details.humidite_sol}%` : 'N/A';
      doc.text(humidite, col1X + 30, yPosition);
      
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text('Température:', col2X, yPosition);
      doc.setTextColor(44, 62, 80);
      doc.setFont('helvetica', 'bold');
      const temp = details.temperature !== undefined ? `${details.temperature}°C` : 'N/A';
      doc.text(temp, col2X + 30, yPosition);

      yPosition = cardStartY + 58;
    }
  }

  // ============================================================================
  // ALERTS PAGE (if any)
  // ============================================================================
  
  if (alertes && alertes.length > 0) {
    doc.addPage();
    
    // Header
    doc.setFillColor(231, 76, 60);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Alertes Maladies (${alertes.length})`, 20, 16);
    
    yPosition = 35;

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
      theme: 'grid',
      headStyles: { fillColor: dangerColor, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 5 },
      alternateRowStyles: { fillColor: [254, 242, 242] }
    });
  }

  // ============================================================================
  // RECOMMENDATIONS PAGE (if any)
  // ============================================================================
  
  if (recommandations && recommandations.length > 0) {
    doc.addPage();
    
    // Header
    doc.setFillColor(52, 152, 219);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Recommandations d'Irrigation (${recommandations.length})`, 20, 16);
    
    yPosition = 35;

    const recosData = recommandations.map(r => [
      r.parcelle?.nom || 'N/A',
      `${r.volume_mm} mm`,
      `${r.duree_minutes} min`,
      r.heure_optimale || 'N/A',
      r.priorite
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['Parcelle', 'Volume', 'Durée', 'Heure', 'Priorité']],
      body: recosData,
      theme: 'grid',
      headStyles: { fillColor: infoColor, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 5 },
      alternateRowStyles: { fillColor: [239, 246, 255] }
    });
  }

  // ============================================================================
  // FOOTER ON ALL PAGES
  // ============================================================================
  
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
    
    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i}/${pageCount}`,
      15,
      pageHeight - 8
    );
    doc.text(
      'AgroTrace-MS © 2025',
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
    doc.text(
      new Date().toLocaleDateString('fr-FR'),
      pageWidth - 15,
      pageHeight - 8,
      { align: 'right' }
    );
  }

  // ============================================================================
  // SAVE
  // ============================================================================
  
  const filename = `AgroTrace_Rapport_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
  console.log(`✅ Rapport PDF généré: ${filename}`);
};

export default exportToPDF;
