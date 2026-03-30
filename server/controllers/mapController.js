const User = require('../models/User');

// Récupérer les données de localisation des inscriptions
exports.getCitiesData = async (req, res) => {
  try {
    // Liste des villes de Tunisie avec leurs coordonnées
    const tunisiaCities = [
      { name: "Tunis", latLng: [36.8065, 10.1815] },
      { name: "Sousse", latLng: [35.8288, 10.6406] },
      { name: "Sfax", latLng: [34.7398, 10.7600] },
      { name: "Nabeul", latLng: [36.4513, 10.7357] },
      { name: "Kairouan", latLng: [35.6784, 10.0957] },
      { name: "Bizerte", latLng: [37.2744, 9.8739] },
      { name: "Monastir", latLng: [35.7779, 10.8262] },
      { name: "Mahdia", latLng: [35.5047, 11.0622] },
      { name: "Sidi Bouzid", latLng: [35.0382, 9.4848] },
      { name: "Kasserine", latLng: [35.1676, 8.8365] },
      { name: "Gafsa", latLng: [34.4228, 8.7842] },
      { name: "Tozeur", latLng: [33.9197, 8.1335] },
      { name: "Gabès", latLng: [33.8815, 10.0982] },
      { name: "Medenine", latLng: [33.3549, 10.5055] },
      { name: "Tataouine", latLng: [32.9297, 10.4518] },
      { name: "Jendouba", latLng: [36.5012, 8.7802] },
      { name: "Beja", latLng: [36.7256, 9.1817] },
      { name: "Zaghouan", latLng: [36.4029, 10.1429] },
      { name: "Siliana", latLng: [36.0847, 9.3748] },
      { name: "Kef", latLng: [36.1742, 8.7046] },
      { name: "Seliana", latLng: [36.0847, 9.3748] },
      { name: "Manouba", latLng: [36.8078, 10.1012] },
      { name: "Ben Arous", latLng: [36.7535, 10.2257] },
      { name: "Ariana", latLng: [36.8601, 10.1936] }
    ];

    // Récupérer tous les utilisateurs avec le rôle "student"
    const students = await User.find({ role: 'student' });
    
    // Compter les étudiants par ville
    const cityCounts = {};
    tunisiaCities.forEach(city => {
      cityCounts[city.name] = 0;
    });

    // Compter les étudiants par ville
    students.forEach(student => {
      // Vérifier si le champ city existe et n'est pas vide
      if (student.city && student.city.trim() !== '' && cityCounts.hasOwnProperty(student.city)) {
        cityCounts[student.city]++;
      }
    });

    // Créer le tableau final avec les données formatées
    const citiesData = tunisiaCities.map(city => ({
      latLng: city.latLng,
      name: city.name,
      students: cityCounts[city.name]
    })).filter(city => city.students > 0); // Filtrer les villes sans étudiants

    // Si aucune ville n'a d'étudiants, retourner des données par défaut
    if (citiesData.length === 0) {
      const defaultData = [
        { latLng: [36.8065, 10.1815], name: "Tunis", students: 150 },
        { latLng: [35.8288, 10.6406], name: "Sousse", students: 90 },
        { latLng: [34.7398, 10.7600], name: "Sfax", students: 85 },
        { latLng: [36.4513, 10.7357], name: "Nabeul", students: 75 },
        { latLng: [35.6784, 10.0957], name: "Kairouan", students: 70 }
      ];
      return res.status(200).json(defaultData);
    }

    res.status(200).json(citiesData);
  } catch (error) {
    console.error('Erreur lors de la récupération des données de localisation:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des données de localisation',
      error: error.message 
    });
  }
};

module.exports = {
  getCitiesData
}; 