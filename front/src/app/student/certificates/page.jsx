"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Image from 'next/image';
import './certificate.css';

const StudentCertificates = () => {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [certificateData, setCertificateData] = useState(null);

  useEffect(() => {
    // Récupérer les données du certificat depuis les paramètres de l'URL
    const formation = searchParams.get('formation');
    const student = searchParams.get('student');
    const mention = searchParams.get('mention');
    const score = searchParams.get('score');
    const date = searchParams.get('date');

    // Si tous les paramètres nécessaires sont présents, créer l'objet certificateData
    if (formation && student && mention && score && date) {
      setCertificateData({
        formation,
        student,
        mention,
        score,
        date
      });
    }
  }, [searchParams]);

  const generateCertificatePDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Configuration de la page
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    // Fond avec dégradé (simulation avec un rectangle blanc)
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Ajouter les bordures décoratives avec coins arrondis
    doc.setDrawColor(139, 115, 85);
    doc.setLineWidth(0.7);
    doc.roundedRect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin, 3, 3);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin + 5, margin + 5, pageWidth - 2 * (margin + 5), pageHeight - 2 * (margin + 5), 2, 2);

    // Ajouter le logo à gauche
    doc.addImage('/assets/images/logo/logo.png', 'PNG', margin + 10, margin + 10, 90, 90);
    
    // Ajouter le symbole de certificat à droite
    doc.setDrawColor(212, 175, 55); // Couleur dorée
    doc.setLineWidth(1);
    const centerX = pageWidth - margin - 55;
    const centerY = margin + 55;
    
    // Cercles dorés
    doc.setFillColor(212, 175, 55);
    doc.circle(centerX, centerY, 45, 'S');
    doc.circle(centerX, centerY, 40, 'S');
    
    // Étoile au centre
    doc.setFillColor(212, 175, 55);
    const points = 5; // Nombre de points de l'étoile
    const outerRadius = 25; // Rayon extérieur
    const innerRadius = 12; // Rayon intérieur
    const rotation = Math.PI / 2; // Rotation de l'étoile (90 degrés)

    let path = [];
    for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI / points) - rotation;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        if (i === 0) {
            path.push(['M', x, y]);
        } else {
            path.push(['L', x, y]);
        }
    }
    path.push(['Z']); // Fermer le chemin

    doc.path(path).fill();

    // Titre principal
    doc.setFont('times', 'bold');
    doc.setFontSize(38);
    doc.setTextColor(44, 62, 80);
    doc.text('Certificat', pageWidth / 2, margin + 35, { align: 'center' });

    // Ligne décorative sous le titre
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - 45, margin + 40, pageWidth / 2 + 45, margin + 40);

    // Sous-titre
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(85, 85, 85);
    doc.text("CE CERTIFICAT EST DÉCERNÉ À", pageWidth / 2, margin + 45, { align: 'center' });

    // Nom de l'étudiant
    doc.setFont('times', 'italic');
    doc.setFontSize(32);
    doc.setTextColor(44, 62, 80);
    doc.text(certificateData.student, pageWidth / 2, margin + 55, { align: 'center' });

    // Ligne décorative sous le nom
    doc.setDrawColor(212, 175, 55);
    doc.line(pageWidth / 2 - 35, margin + 60, pageWidth / 2 + 35, margin + 60);

    // Texte descriptif
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(68, 68, 68);
    const description = [
      `Pour avoir complété avec succès la formation "${certificateData.formation}" avec une`,
      `mention ${certificateData.mention.toLowerCase()} et un score de ${certificateData.score}/20,`,
      `cette certification atteste des compétences acquises et de l'engagement`,
      `démontré tout au long de la formation.`
    ];
    
    description.forEach((line, index) => {
      doc.text(line, pageWidth / 2, margin + 70 + (index * 6), { align: 'center' });
    });

    // Date
    doc.setFont('times', 'italic');
    doc.setFontSize(11);
    doc.setTextColor(85, 85, 85);
    const dateStr = `Fait à Mahdia, le ${format(new Date(certificateData.date), 'dd MMMM yyyy', { locale: fr })}`;
    doc.text(dateStr, pageWidth / 2, margin + 100, { align: 'center' });

    // Signatures
    const signatureY = margin + 110;
    
    // Signature gauche
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1.5);
    
    // Dessiner la signature gauche
    const leftSignX = margin + 35;
    doc.lines([
      [10, -3], [5, -12], [5, -5], [5, 5], [5, -3], [5, -5], [5, 3],
      [5, -2], [5, -3], [5, 2], [5, -4], [5, 3], [5, -2], [5, 4]
    ], leftSignX, signatureY + 10);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Directeur de Formation', margin + 70, signatureY + 25, { align: 'center' });
    doc.setFont('times', 'italic');
    doc.text('Jean Dupont', margin + 70, signatureY + 35, { align: 'center' });

    // Signature droite
    const rightSignX = pageWidth - margin - 140;
    doc.lines([
      [10, -2], [5, -8], [5, -3], [5, 5], [5, -4], [5, -3], [5, 2],
      [5, -3], [5, -2], [5, 3], [5, -3], [5, 2], [5, -3], [5, 3]
    ], rightSignX, signatureY + 10);

    doc.setFont('helvetica', 'bold');
    doc.text('Président de Smartech', pageWidth - margin - 70, signatureY + 25, { align: 'center' });
    doc.setFont('times', 'italic');
    doc.text('Marc Martin', pageWidth - margin - 70, signatureY + 35, { align: 'center' });

    // Sceau central
    const sealY = margin + 120;
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.5);
    doc.circle(pageWidth / 2, sealY, 15, 'S');
    doc.circle(pageWidth / 2, sealY, 12, 'S');
    doc.setFont('times', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(212, 175, 55);
    doc.text('SCEAU', pageWidth / 2, sealY - 2, { align: 'center' });
    doc.text("D'EXCELLENCE", pageWidth / 2, sealY + 2, { align: 'center' });

    // Informations de l'entreprise
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(102, 102, 102);
    doc.text('Smartech - Formation Professionnelle', pageWidth / 2, pageHeight - margin - 15, { align: 'center' });
    doc.text('123 Avenue de la liberté, 75011 Mahdia', pageWidth / 2, pageHeight - margin - 10, { align: 'center' });
    
    return doc;
  };

  const handleDownload = () => {
    if (certificateData) {
      const pdfDoc = generateCertificatePDF();
      pdfDoc.save(`certificat_${certificateData.student.replace(/\s+/g, '_')}.pdf`);
      toast.success('Certificat téléchargé avec succès');
    }
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!certificateData) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <i className="bi bi-exclamation-circle me-2"></i>
          <div>Aucun certificat sélectionné</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="certificate-container">
        <div className="certificate">
          <div className="certificate-corner corner-top-left"></div>
          <div className="certificate-corner corner-top-right"></div>
          <div className="certificate-corner corner-bottom-left"></div>
          <div className="certificate-corner corner-bottom-right"></div>
          
          <div className="certificate-content">
            <div style={{ display: 'flex', alignItems: 'center', position: 'absolute', top: '10px', left: '10px' }}>
              <Image
                src="/assets/images/logo/logo.png"
                alt="Smartech"
                width={90}
                height={90}
                style={{ objectFit: 'contain' }}
              />
            </div>
            
            <div style={{ position: 'absolute', top: '10px', right: '10px', width: '90px', height: '90px' }}>
              <svg viewBox="0 0 100 100" width="100%" height="100%">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#d4af37" strokeWidth="2"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke="#d4af37" strokeWidth="2"/>
                <path
                  d="M50 15 L61 40 L88 40 L66 55 L76 80 L50 65 L24 80 L34 55 L12 40 L39 40 Z"
                  fill="#d4af37"
                  stroke="#d4af37"
                  strokeWidth="1"
                />
              </svg>
            </div>
            
            <div className="certificate-header">
              <h1 className="certificate-title">Certificat</h1>
              <h2 className="certificate-subtitle">CE CERTIFICAT EST DÉCERNÉ À</h2>
            </div>

            <div className="certificate-name">
              {certificateData.student}
            </div>

            <p className="certificate-text">
              Pour avoir complété avec succès la formation "{certificateData.formation}" avec une mention {certificateData.mention.toLowerCase()} et un score de {certificateData.score}/20, cette certification atteste des compétences acquises et de l'engagement démontré tout au long de la formation.
            </p>

            <div className="certificate-date">
              Fait à Mahdia, le {format(new Date(certificateData.date), 'dd MMMM yyyy', { locale: fr })}
            </div>

            <div className="certificate-footer">
              <div className="signature-section">
                <svg viewBox="0 0 200 60" width="150" height="45">
                  <path
                    d="M20,40 C30,37 35,25 40,20 C45,15 50,10 55,15 C60,20 65,35 70,40 C75,45 80,40 85,35 C90,30 95,25 100,20 M105,15 C110,20 115,25 120,30 M80,20 C85,15 90,10 95,15"
                    fill="none"
                    stroke="#000"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="signature-line">
                  <span className="signature-title">Directeur de Formation</span>
                  <span className="signature-name">Jean Dupont</span>
                </div>
              </div>
              
              <div className="signature-section">
                <svg viewBox="0 0 200 60" width="150" height="45">
                  <path
                    d="M30,30 C40,25 45,20 50,25 C55,30 60,40 65,35 C70,30 75,20 80,25 C85,30 90,40 95,35 C100,30 105,25 110,30 M115,25 C120,30 125,35 130,30 M70,15 C75,20 80,25 85,20"
                    fill="none"
                    stroke="#000"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="signature-line">
                  <span className="signature-title">Président de Smartech</span>
                  <span className="signature-name">Marc Martin</span>
                </div>
              </div>
            </div>

            <div className="certificate-seal">
              <div className="seal-content">
                <svg viewBox="0 0 100 100" width="80%" height="80%">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#d4af37" strokeWidth="2"/>
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#d4af37" strokeWidth="1"/>
                  <text x="50" y="50" textAnchor="middle" fill="#d4af37" fontSize="10" fontFamily="serif">SCEAU D'EXCELLENCE</text>
                </svg>
              </div>
            </div>

            <div className="company-info">
              Smartech - Formation Professionnelle<br />
              123 Avenue de la liberté, 75011 Mahdia
            </div>
          </div>
        </div>
      </div>

      <div className="certificate-actions">
        <button 
          className="btn-generate"
          onClick={handleDownload}
        >
          <i className="bi bi-file-earmark-pdf me-2"></i>
          Télécharger en PDF
        </button>
      </div>
    </div>
  );
};

export default StudentCertificates; 