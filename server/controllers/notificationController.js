const Notification = require('../models/Notification');
const User = require('../models/User');

// Créer une nouvelle notification
exports.createNotification = async (req, res) => {
  try {
    const { recipientId, recipientRole, senderId, type, message, data } = req.body;
    
    console.log('Tentative de création de notification:', {
      recipientId,
      recipientRole,
      senderId,
      type,
      message,
      data
    });

    // Vérification des champs requis
    if (!senderId || !type || !message || (!recipientId && !recipientRole)) {
      console.error('Champs manquants:', { recipientId, recipientRole, senderId, type, message });
      return res.status(400).json({
        success: false,
        message: 'Tous les champs requis doivent être fournis'
      });
    }

    // Vérification du type de notification
    if (!['cv_shared', 'enrollment_request', 'enrollment_approved', 'enrollment_rejected', 
          'supervision_request', 'supervision_accepted', 'supervision_rejected', 
          'supervision_stopped', 'payment_completed', 'certificate_generated',
          'instructor_signup', 'student_signup', 'course_added', 'event_added',
          'event_joined', 'event_left'].includes(type)) {
      console.error('Type de notification invalide:', type);
      return res.status(400).json({
        success: false,
        message: 'Type de notification invalide'
      });
    }

    const notification = new Notification({
      recipient: recipientId,
      recipientRole: recipientRole,
      sender: senderId,
      type,
      message,
      data: data || {},
      isRead: false
    });

    console.log('Notification créée, tentative de sauvegarde...');
    await notification.save();
    console.log('Notification sauvegardée avec succès:', notification);

    res.status(201).json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Erreur détaillée création notification:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Gestion spécifique des erreurs de validation MongoDB
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation des données',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la notification',
      error: error.message
    });
  }
};

// Récupérer les notifications d'un utilisateur
exports.getMyNotifications = async (req, res) => {
  try {
    console.log('Tentative de récupération des notifications pour l\'utilisateur:', req.user.id);

    // Récupérer le rôle de l'utilisateur
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    console.log('Rôle de l\'utilisateur:', user.role);

    // Requête pour trouver les notifications adressées directement à l'utilisateur
    // ou à son rôle (par exemple 'admin')
    const notifications = await Notification.find({
      $or: [
        { recipient: req.user.id },
        { recipientRole: user.role }
      ]
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'firstName lastName profileImage')
      .populate('formationId', 'title description')
      .populate({
        path: 'enrollmentId',
        select: 'status progress purchaseDate',
        populate: {
          path: 'studentId',
          select: 'firstName lastName email profileImage'
        }
      });

    console.log('Notifications trouvées:', {
      count: notifications.length,
      notifications: notifications.map(n => ({
        id: n._id,
        type: n.type,
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt,
        recipientRole: n.recipientRole,
        data: n.data
      }))
    });

    res.json(notifications);
  } catch (error) {
    console.error('Erreur détaillée récupération notifications:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notifications'
    });
  }
};

// Marquer une notification comme lue
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    console.log('Tentative de mise à jour de la notification:', {
      notificationId: id,
      userId: userId
    });

    // Validation de base
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID de notification manquant'
      });
    }

    try {
      // Utiliser findOneAndUpdate au lieu de find + save
      const updatedNotification = await Notification.findOneAndUpdate(
        { _id: id },
        { $set: { isRead: true } },
        { 
          new: true,
          runValidators: true
        }
      ).exec();

      console.log('Résultat de la mise à jour:', updatedNotification);

      if (!updatedNotification) {
        return res.status(404).json({
          success: false,
          message: 'Notification non trouvée'
        });
      }

      return res.json({
        success: true,
        notification: updatedNotification
      });

    } catch (dbError) {
      console.error('Erreur lors de la mise à jour en base de données:', {
        error: dbError.message,
        stack: dbError.stack
      });
      
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour en base de données',
        error: dbError.message
      });
    }

  } catch (error) {
    console.error('Erreur générale dans markAsRead:', {
      error: error.message,
      stack: error.stack,
      params: req.params
    });

    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour de la notification',
      error: error.message
    });
  }
};

// Marquer toutes les notifications comme lues
exports.markAllAsRead = async (req, res) => {
  try {
    console.log('Tentative de marquer toutes les notifications comme lues pour:', req.user.id);
    
    // Récupérer le rôle de l'utilisateur
    const user = await User.findById(req.user.id);
    
    // Mettre à jour les notifications adressées personnellement ou par rôle
    const result = await Notification.updateMany(
      { 
        $or: [
          { recipient: req.user.id, isRead: false },
          { recipientRole: user.role, isRead: false }
        ]
      },
      { $set: { isRead: true } }
    );

    console.log('Résultat de la mise à jour:', result);

    res.json({
      success: true,
      message: 'Toutes les notifications ont été marquées comme lues',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Erreur lors du marquage de toutes les notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du marquage des notifications comme lues',
      error: error.message
    });
  }
};

// Récupérer les notifications de l'utilisateur
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Récupération des notifications pour l'utilisateur: ${userId}`);

    // Récupérer l'utilisateur pour obtenir son rôle
    const user = await User.findById(userId);
    if (!user) {
      console.log(`Utilisateur ${userId} non trouvé`);
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    console.log(`Role de l'utilisateur: ${user.role}`);
    
    // Rechercher les notifications pour cet utilisateur ou pour son rôle
    const query = {
      $or: [
        { recipient: userId },
        { recipientRole: user.role }
      ]
    };
    
    console.log('Requête de notifications:', JSON.stringify(query));
    
    const notifications = await Notification.find(query)
      .populate('sender', 'firstName lastName profileImage email')
      .populate({
        path: 'formationId',
        select: 'title description'
      })
      .populate({
        path: 'enrollmentId',
        select: 'status purchaseDate',
        populate: {
          path: 'studentId',
          select: 'firstName lastName email profileImage'
        }
      })
      .sort({ createdAt: -1 });
    
    console.log(`${notifications.length} notifications trouvées`);
    if (notifications.length > 0) {
      console.log('Première notification:', JSON.stringify(notifications[0], null, 2));
    }
    
    res.json(notifications);
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}; 