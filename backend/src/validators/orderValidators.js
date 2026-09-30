const { body, param, query } = require('express-validator');
const Order = require('../models/Order');

const idParam = [param('id').isMongoId().withMessage('Invalid order id')];

const itemsRules = (optional) => {
  const items = body('items');
  return [
    (optional ? items.optional() : items)
      .isArray({ min: 1, max: 20 }).withMessage('items must be a list of 1 to 20 entries'),
    body('items.*.menuItem').isMongoId().withMessage('Each item needs a valid menuItem id'),
    body('items.*.quantity').isInt({ min: 1, max: 20 }).withMessage('Quantity must be between 1 and 20').toInt(),
  ];
};

const createRules = [
  ...itemsRules(false),
  body('deliveryAddress').trim().notEmpty().withMessage('Delivery address is required')
    .isLength({ max: 200 }).withMessage('Address must be 200 characters or fewer'),
  body('notes').optional().trim().isLength({ max: 300 }).withMessage('Notes must be 300 characters or fewer'),
];

const updateRules = [
  ...idParam,
  ...itemsRules(true),
  body('deliveryAddress').optional().trim().notEmpty().withMessage('Delivery address cannot be empty')
    .isLength({ max: 200 }).withMessage('Address must be 200 characters or fewer'),
  body('notes').optional().trim().isLength({ max: 300 }).withMessage('Notes must be 300 characters or fewer'),
];

const statusRules = [
  ...idParam,
  body('status').isIn(Order.STATUSES).withMessage(`Status must be one of: ${Order.STATUSES.join(', ')}`),
];

const listRules = [
  query('status').optional().isIn(Order.STATUSES).withMessage('Unknown status'),
];

module.exports = { idParam, createRules, updateRules, statusRules, listRules };
