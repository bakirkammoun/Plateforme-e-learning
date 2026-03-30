import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { ROUTES } from '../../routes/config';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import api from '../../config/axios';
import './ManageCertificate.css';
import logo from './logo.png';

const Certificates = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const quizResult = location.state?.quizResult;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!quizResult) {
      toast.error('Aucune donnée de quiz disponible');
      navigate(ROUTES.CERTIFICATES.QUIZ_LIST);
    }
  }, [quizResult, navigate]);

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
    doc.addImage(logo, 'PNG', margin + 10, margin + 10, 90, 90);
    
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
    doc.text(quizResult.student, pageWidth / 2, margin + 55, { align: 'center' });

    // Ligne décorative sous le nom
    doc.setDrawColor(212, 175, 55);
    doc.line(pageWidth / 2 - 35, margin + 60, pageWidth / 2 + 35, margin + 60);

    // Texte descriptif
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(68, 68, 68);
    const description = [
      `Pour avoir complété avec succès la formation "${quizResult.formation}" avec une`,
      `mention ${quizResult.mention.toLowerCase()} et un score de ${quizResult.score}/20,`,
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
    const dateStr = `Fait à Mahdia, le ${format(new Date(quizResult.date), 'dd MMMM yyyy', { locale: fr })}`;
    doc.text(dateStr, pageWidth / 2, margin + 100, { align: 'center' });

    // Signatures
    const signatureY = margin + 110;
    
    // Signature gauche
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1.5);
    
    // Dessiner la signature gauche directement aux bonnes coordonnées
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

  const handleGenerateCertificate = async () => {
    setLoading(true);
    try {
      console.log('Quiz Result Data:', quizResult);

      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const certificateData = {
        studentId: quizResult.studentId,
        email: quizResult.studentEmail || quizResult.email || '',
        formation: quizResult.formation || quizResult.quizTitle,
        student: quizResult.student || quizResult.studentName,
        mention: quizResult.mention || (
          quizResult.score >= 16 ? 'Très Bien' : 
          quizResult.score >= 14 ? 'Bien' : 
          quizResult.score >= 12 ? 'Assez Bien' : 
          'Passable'
        ),
        score: quizResult.score,
        date: quizResult.date || quizResult.completedAt || new Date().toISOString()
      };

      // Validate required fields
      const requiredFields = ['formation', 'student', 'mention', 'score'];
      const missingFields = requiredFields.filter(field => !certificateData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Champs requis manquants : ${missingFields.join(', ')}`);
      }

      // Add detailed validation logging
      console.log('Certificate Data Validation:', {
        certificateData,
        validation: {
          studentId: { value: certificateData.studentId, exists: !!certificateData.studentId },
          formation: { value: certificateData.formation, exists: !!certificateData.formation },
          student: { value: certificateData.student, exists: !!certificateData.student },
          mention: { value: certificateData.mention, exists: !!certificateData.mention },
          score: { value: certificateData.score, exists: !!certificateData.score }
        },
        rawQuizResult: quizResult
      });

      // Send the request to generate certificate
      const response = await api.post('/api/certificates/generate', certificateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Server response:', response.data);

      if (response.data.success) {
        // Show success messages
        toast.success('📝 Notification envoyée avec succès !');
        toast.success('📧 Un email a été envoyé à l\'étudiant');
        toast.success('🎓 Une notification de certificat a été créée pour l\'étudiant');

        // Déclencher l'événement de notification
        const certificateGeneratedEvent = new CustomEvent('certificateGenerated', {
          detail: {
            certificateData,
            notificationId: response.data.data.notificationId
          }
        });
        window.dispatchEvent(certificateGeneratedEvent);

        // Redirect after a short delay
        setTimeout(() => {
      navigate(ROUTES.CERTIFICATES.QUIZ_LIST);
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Erreur lors de l\'envoi de la notification à l\'étudiant');
      }
    } catch (error) {
      console.error('Detailed error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack,
        url: error.config?.url,
        method: error.config?.method
      });
      
      let errorMessage = error.message;
      
      if (error.response?.status === 404) {
        errorMessage = 'Le service de notifications n\'est pas accessible. Veuillez vérifier que le serveur est en cours d\'exécution.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    const pdfDoc = generateCertificatePDF();
    pdfDoc.save(`certificat_${quizResult.student.replace(/\s+/g, '_')}.pdf`);
    toast.success('Certificat téléchargé avec succès');
  };

  if (!quizResult) {
    return (
      <div className="container-fluid px-4 py-5">
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <i className="bi bi-exclamation-circle me-2"></i>
          <div>Aucune donnée de quiz disponible</div>
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
              <img src={logo} alt="Smartech" style={{ width: '90px', height: '90px' }} />
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
              <h2 className="certificate-subtitle" style={{ marginTop: '2px' }}>CE CERTIFICAT EST DÉCERNÉ À</h2>
        </div>

            <div className="certificate-name" style={{ marginTop: '1px' }}>
              {quizResult.student}
      </div>

            <p className="certificate-text" style={{ marginTop: '5px' }}>
              Pour avoir complété avec succès la formation "{quizResult.formation}" avec une mention {quizResult.mention.toLowerCase()} et un score de {quizResult.score}/20, cette certification atteste des compétences acquises et de l'engagement démontré tout au long de la formation.
            </p>

            <div className="certificate-date" style={{ marginTop: '4px' }}>
              Fait à Mahdia, le {format(new Date(quizResult.date), 'dd MMMM yyyy', { locale: fr })}
            </div>

            <div className="certificate-footer" style={{ marginTop: '0' }}>
              <div className="signature-section" style={{ marginTop: '0' }}>
                <svg viewBox="0 0 200 60" width="150" height="45" style={{ marginBottom: '0' }}>
                  <path
                    d="M20,40 C30,37 35,25 40,20 C45,15 50,10 55,15 C60,20 65,35 70,40 C75,45 80,40 85,35 C90,30 95,25 100,20 M105,15 C110,20 115,25 120,30 M80,20 C85,15 90,10 95,15"
                    fill="none"
                    stroke="#000"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="signature-line" style={{ marginTop: '0' }}>
                  <span className="signature-title">Directeur de Formation</span>
                  <span className="signature-name">Jean Dupont</span>
            </div>
          </div>
              
              <div className="signature-section" style={{ marginTop: '0' }}>
                <svg viewBox="0 0 200 60" width="150" height="45" style={{ marginBottom: '0' }}>
                  <path
                    d="M30,30 C40,25 45,20 50,25 C55,30 60,40 65,35 C70,30 75,20 80,25 C85,30 90,40 95,35 C100,30 105,25 110,30 M115,25 C120,30 125,35 130,30 M70,15 C75,20 80,25 85,20"
                    fill="none"
                    stroke="#000"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="signature-line" style={{ marginTop: '0' }}>
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
          onClick={handleGenerateCertificate}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Génération en cours...
            </>
          ) : (
            <>
              <i className="bi bi-envelope me-2"></i>
              Envoyer la notification à l'étudiant
            </>
          )}
        </button>
        <button 
          className="btn-generate"
          onClick={handleDownloadPDF}
          style={{ backgroundColor: '#2c3e50', marginLeft: '10px' }}
        >
          <i className="bi bi-file-earmark-pdf me-2"></i>
          Télécharger en PDF
        </button>
        <button 
          className="btn-back"
          onClick={() => navigate(ROUTES.CERTIFICATES.QUIZ_LIST)}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Retour à la liste
        </button>
      </div>
    </div>
  );
};

export default Certificates; 