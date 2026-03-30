const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const Formation = require('../models/Formation');
const User = require('../models/User');

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Orders route is working' });
});

// Get all orders with stats for admin or just user orders for regular users
router.get('/', auth, async (req, res) => {
  try {
    console.log('GET /api/orders - Début de la requête');
    console.log('User ID:', req.user.id);

    // Vérifier si l'utilisateur est un admin
    const user = await User.findById(req.user.id);
    console.log('User role:', user.role);

    const isAdmin = user.role === 'admin';

    let orders;
    if (isAdmin) {
      console.log('Admin user - fetching all orders');
      // Pour les admins, récupérer toutes les commandes avec détails
      orders = await Order.find()
        .populate({
          path: 'userId',
          select: 'firstName lastName email profileImage'
        })
        .populate({
          path: 'formations',
          populate: {
            path: 'instructorId',
            select: 'firstName lastName email'
          }
        })
        .sort({ createdAt: -1 });

      console.log('Found orders:', orders.length);

      // Calculer le total des ventes
      const totalSales = orders.reduce((total, order) => total + order.totalAmount, 0);
      console.log('Total sales:', totalSales);

      // Grouper les ventes par formation
      const salesByFormation = {};
      orders.forEach(order => {
        order.formations.forEach(formation => {
          if (!salesByFormation[formation._id]) {
            salesByFormation[formation._id] = {
              formationId: formation._id,
              title: formation.title,
              instructor: formation.instructorId ? `${formation.instructorId.firstName} ${formation.instructorId.lastName}` : 'Unknown',
              totalSales: 0,
              numberOfSales: 0
            };
          }
          salesByFormation[formation._id].totalSales += formation.price || 0;
          salesByFormation[formation._id].numberOfSales += 1;
        });
      });

      console.log('Sending admin response');
      return res.json({
        orders,
        totalSales,
        salesByFormation: Object.values(salesByFormation)
      });
    } else {
      console.log('Regular user - fetching user orders');
      // Pour les utilisateurs normaux, récupérer uniquement leurs commandes
      orders = await Order.find({ userId: req.user.id })
        .populate('formations')
        .sort({ createdAt: -1 });
      console.log('Found user orders:', orders.length);
      return res.json(orders);
    }
  } catch (error) {
    console.error('Error in GET /api/orders:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new order
router.post('/', auth, async (req, res) => {
  try {
    const { formations, totalAmount } = req.body;
    const order = new Order({
      userId: req.user.id,
      formations,
      totalAmount,
      status: 'pending'
    });
    const newOrder = await order.save();
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const isAdmin = user.role === 'admin';
    
    let order;
    if (isAdmin) {
      order = await Order.findById(req.params.id).populate('formations');
    } else {
      order = await Order.findOne({ _id: req.params.id, userId: req.user.id }).populate('formations');
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update order status (Admin only)
router.patch('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    order.status = status;
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 