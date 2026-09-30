const express = require('express');
const ctrl = require('../controllers/orderController');
const rules = require('../validators/orderValidators');
const validate = require('../middleware/validate');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(rules.listRules, validate, ctrl.getOrders)
  .post(rules.createRules, validate, ctrl.createOrder);

router.route('/:id')
  .get(rules.idParam, validate, ctrl.getOrder)
  .put(rules.updateRules, validate, ctrl.updateOrder)
  .delete(rules.idParam, validate, ctrl.deleteOrder);

router.patch('/:id/cancel', rules.idParam, validate, ctrl.cancelOrder);
router.patch('/:id/status', adminOnly, rules.statusRules, validate, ctrl.updateOrderStatus);

module.exports = router;
