const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');
const User = require('../models/User');
const jsPDF = require('jspdf');
const auth = require('../middleware/auth');  // Ajout du middleware d'authentification

console.log('=== Initialisation du router des certificats ===');

// Route racine pour tester la connexion
router.get('/', (req, res) => {
  console.log('GET / - Route racine des certificats accédée');
  res.json({ 
    message: 'API des certificats est active',
    routes: {
      root: '/',
      generate: '/generate'
    }
  });
});

// Générer et envoyer le certificat
router.post('/generate', auth, async (req, res) => {
  try {
    const { studentId, email, formation, student, mention, score, date } = req.body;
    
    console.log('=== Génération de certificat ===');
    console.log('Données reçues:', { studentId, email, formation, student, mention, score });
    console.log('Utilisateur authentifié:', req.user);

    // Vérification des données requises
    if (!formation || !student || !mention || !score) {
      console.log('❌ Données manquantes');
      return res.status(400).json({
        success: false,
        message: 'Données manquantes pour la génération du certificat',
        required: ['formation', 'student', 'mention', 'score'],
        received: req.body
      });
    }

    // Vérification du rôle administrateur
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les administrateurs peuvent générer des certificats'
      });
    }

    // Rechercher l'étudiant
    let recipientId = studentId;
    if (!recipientId) {
      console.log('Recherche de l\'étudiant par son nom:', student);
      const foundStudent = await User.findOne({
        $or: [
          { firstName: { $regex: new RegExp(student.split(' ')[0], 'i') } },
          { lastName: { $regex: new RegExp(student.split(' ').slice(1).join(' '), 'i') } }
        ],
        role: 'student'
      });
      
      if (foundStudent) {
        recipientId = foundStudent._id;
        console.log('Étudiant trouvé:', foundStudent._id);
      } else {
        console.error('❌ Étudiant non trouvé');
        return res.status(404).json({
          success: false,
          message: 'Étudiant non trouvé dans la base de données'
        });
      }
    }

    // Créer la notification
    try {
      const notification = new Notification({
        recipient: recipientId,
        recipientRole: 'student',
        sender: req.user._id,
        type: 'certificate_generated',
        message: `Votre certificat pour la formation "${formation}" est disponible`,
        data: {
          certificateData: {
            formation,
            student,
            mention,
            score,
            date: date || new Date().toISOString()
          }
        },
        isRead: false
      });

      console.log('Création de la notification:', {
        recipient: recipientId,
        type: 'certificate_generated',
        data: notification.data
      });

      const savedNotification = await notification.save();
      console.log('✅ Notification sauvegardée:', savedNotification._id);

      // Envoyer un email si l'adresse est disponible
      if (email) {
        try {
          // Configuration du transporteur d'email
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS
            }
          });

          // Envoyer l'email
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Votre certificat est disponible',
            html: `
              <h1>Félicitations !</h1>
              <p>Votre certificat pour la formation "${formation}" est maintenant disponible.</p>
              <p>Détails :</p>
              <ul>
                <li>Formation : ${formation}</li>
                <li>Mention : ${mention}</li>
                <li>Score : ${score}/20</li>
              </ul>
              <p>Connectez-vous à votre compte pour télécharger votre certificat.</p>
            `
          });
          console.log('✅ Email envoyé à:', email);
        } catch (emailError) {
          console.error('❌ Erreur lors de l\'envoi de l\'email:', emailError);
          // Ne pas bloquer le processus si l'email échoue
        }
      }

      // Envoyer la réponse
      res.status(200).json({
        success: true,
        message: 'Notification envoyée à l\'étudiant avec succès',
        data: {
          notificationId: savedNotification._id,
          certificateData: notification.data.certificateData
        }
      });

    } catch (notifError) {
      console.error('❌ Erreur lors de la création de la notification:', notifError);
      throw notifError;
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du certificat',
      error: error.message
    });
  }
});

// Route pour télécharger un certificat
router.get('/:notificationId/download', async (req, res) => {
  console.log('\n=== GET /:notificationId/download - Téléchargement de certificat ===');
  
  try {
    const { notificationId } = req.params;
    
    // Vérifier que la notification existe et appartient à l'utilisateur
    const notification = await Notification.findById(notificationId)
      .populate('recipient')
      .populate('sender');
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }

    // Vérifier que c'est bien une notification de certificat
    if (notification.type !== 'certificate_generated') {
      return res.status(400).json({
        success: false,
        message: 'Cette notification ne correspond pas à un certificat'
      });
    }

    // Vérifier que l'utilisateur a le droit d'accéder à ce certificat
    if (notification.recipient._id.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas le droit d\'accéder à ce certificat'
      });
    }

    // Générer le PDF
    const { formation, student, mention, score, date } = notification.data.certificateData;
    
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
    doc.text(student, pageWidth / 2, margin + 55, { align: 'center' });

    // Ligne décorative sous le nom
    doc.setDrawColor(212, 175, 55);
    doc.line(pageWidth / 2 - 35, margin + 60, pageWidth / 2 + 35, margin + 60);

    // Texte descriptif
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(68, 68, 68);
    const description = [
      `Pour avoir complété avec succès la formation "${formation}" avec une`,
      `mention ${mention.toLowerCase()} et un score de ${score}/20,`,
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
    const dateStr = new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    doc.text(`Fait à Mahdia, le ${dateStr}`, pageWidth / 2, margin + 100, { align: 'center' });

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

    // Envoyer le PDF
    const pdfBuffer = doc.output('arraybuffer');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificat_${student.replace(/\s+/g, '_')}.pdf`);
    res.send(Buffer.from(pdfBuffer));

  } catch (error) {
    console.error('❌ Erreur lors du téléchargement du certificat:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du téléchargement du certificat',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Export the router
console.log('=== Routes des certificats initialisées ===');
module.exports = router; 