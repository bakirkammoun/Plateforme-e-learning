const User = require('../models/User');

const getDemographicData = async (req, res) => {
  try {
    // Récupérer tous les utilisateurs
    const users = await User.find({ role: 'student' });
    
    // Initialiser les données par région
    const regions = {
      'Grand Tunis': { students: 0, total: 0 },
      'Sahel': { students: 0, total: 0 },
      'Nord': { students: 0, total: 0 },
      'Sud': { students: 0, total: 0 }
    };

    // Compter les étudiants par région
    users.forEach(user => {
      if (user.region && regions[user.region]) {
        regions[user.region].students++;
      }
    });

    // Calculer le total et les pourcentages
    const total = users.length;
    const demographicData = Object.entries(regions).map(([region, data]) => ({
      region,
      students: data.students,
      percentage: total > 0 ? Math.round((data.students / total) * 100) : 0
    }));

    // Trier par nombre d'étudiants (ordre décroissant)
    demographicData.sort((a, b) => b.students - a.students);

    res.json(demographicData);
  } catch (error) {
    console.error('Erreur lors de la récupération des données démographiques:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des données démographiques' });
  }
};

module.exports = {
  getDemographicData
}; 