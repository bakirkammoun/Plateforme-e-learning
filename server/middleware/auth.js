const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    // Récupérer le token du header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Token reçu:', token ? 'Présent' : 'Manquant');

    if (!token) {
      console.log('Token manquant dans la requête');
      return res.status(401).json({
        success: false,
        message: 'Accès refusé. Token manquant'
      });
    }

    try {
      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token décodé complet:', decoded);
      
      // Gérer les deux formats possibles du token
      const userId = decoded.user?.id || decoded.id;
      const userRole = decoded.user?.role || decoded.role;

      if (!userId) {
        console.error('ID utilisateur manquant dans le token décodé');
        return res.status(401).json({
          success: false,
          message: 'Token invalide: ID utilisateur manquant'
        });
      }

      console.log('Informations utilisateur extraites:', {
        userId,
        role: userRole
      });
      
      // Ajouter les informations de l'utilisateur à la requête avec les deux formats d'ID
      req.user = {
        id: userId,
        _id: userId, // Ajouter _id pour compatibilité avec MongoDB
        role: userRole
      };

      next();
    } catch (error) {
      console.error('Erreur de vérification du token:', {
        error: error.message,
        name: error.name,
        stack: error.stack
      });
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }
  } catch (error) {
    console.error('Erreur dans le middleware d\'authentification:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'authentification'
    });
  }
}; 