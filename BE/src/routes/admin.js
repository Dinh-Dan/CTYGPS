const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Mig 059: portal /admin/ phuc vu CA admin VA staff (nhan vien thuong).
// Tung route nhay cam (duyet thanh toan, tat toan no, finalize luong, CRUD NV,
// sua opening_balance, sua gia tier, ghi settings) tu gate requireRole('admin')
// ben trong sub-router.
router.use(verifyToken, requireRole('admin', 'staff'));

router.get('/ping', (req, res) => {
  res.json({ ok: true, role: req.user.role, user: req.user });
});

router.use('/customers',   require('./admin/customers'));
router.use('/customer-assets', require('./admin/customer-assets'));
router.use('/uploads',     require('./admin/uploads'));
router.use('/suppliers',   require('./admin/suppliers'));
router.use('/inventory',   require('./admin/inventory'));
router.use('/categories',  require('./admin/categories'));
router.use('/price-tiers', require('./admin/price-tiers'));
router.use('/products',    require('./admin/products'));
router.use('/staff',       require('./admin/staff'));
router.use('/staff',       require('./admin/payroll'));
router.use('/staff-issues', require('./admin/staff-issues'));
router.use('/staff-stock', require('./admin/staff-stock'));
router.use('/orders',      require('./admin/orders'));
router.use('/order-templates', require('./admin/order-templates'));
router.use('/debts',       require('./admin/debts'));
router.use('/settings',    require('./admin/settings'));
router.use('/reports',     require('./admin/reports'));
router.use('/notifications', require('./admin/notifications'));
router.use('/conversations', require('./admin/conversations'));

module.exports = router;
