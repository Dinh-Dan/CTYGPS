const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Tat ca route admin yeu cau dang nhap + role admin
router.use(verifyToken, requireRole('admin'));

router.get('/ping', (req, res) => {
  res.json({ ok: true, role: 'admin', user: req.user });
});

router.use('/customers',   require('./admin/customers'));
router.use('/uploads',     require('./admin/uploads'));
router.use('/suppliers',   require('./admin/suppliers'));
router.use('/inventory',   require('./admin/inventory'));
router.use('/categories',  require('./admin/categories'));
router.use('/price-tiers', require('./admin/price-tiers'));
router.use('/products',    require('./admin/products'));
router.use('/staff',       require('./admin/staff'));
router.use('/orders',      require('./admin/orders'));
router.use('/warranty-orders', require('./admin/warranty'));
router.use('/repair-orders',   require('./admin/repair'));
router.use('/remittances', require('./admin/remittances'));
router.use('/debts',       require('./admin/debts'));
router.use('/settings',    require('./admin/settings'));
router.use('/reports',     require('./admin/reports'));
router.use('/badges',      require('./admin/badges'));
router.use('/notifications', require('./admin/notifications'));
router.use('/conversations', require('./admin/conversations'));

module.exports = router;
