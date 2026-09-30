const { body, param, query } = require('express-validator');
const MenuItem = require('../models/MenuItem');

const idParam = [param('id').isMongoId().withMessage('Invalid menu item id')];

// Fields arrive as strings because the form is multipart/form-data (for the image),
// so each number/boolean is checked and then converted.
const createRules = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ max: 80 }).withMessage('Name must be 80 characters or fewer'),
  body('description').optional().trim().isLength({ max: 500 })
    .withMessage('Description must be 500 characters or fewer'),
  body('category').isIn(MenuItem.CATEGORIES)
    .withMessage(`Category must be one of: ${MenuItem.CATEGORIES.join(', ')}`),
  body('price').isFloat({ min: 0, max: 100000 }).withMessage('Price must be a number between 0 and 100000').toFloat(),
  body('stockQuantity').isInt({ min: 0, max: 10000 }).withMessage('Stock must be a whole number between 0 and 10000').toInt(),
  body('isAvailable').optional().isBoolean().withMessage('isAvailable must be true or false').toBoolean(),
];

// Same rules, but every field is optional on update
const updateRules = [
  ...idParam,
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty')
    .isLength({ max: 80 }).withMessage('Name must be 80 characters or fewer'),
  body('description').optional().trim().isLength({ max: 500 })
    .withMessage('Description must be 500 characters or fewer'),
  body('category').optional().isIn(MenuItem.CATEGORIES)
    .withMessage(`Category must be one of: ${MenuItem.CATEGORIES.join(', ')}`),
  body('price').optional().isFloat({ min: 0, max: 100000 }).withMessage('Price must be a number between 0 and 100000').toFloat(),
  body('stockQuantity').optional().isInt({ min: 0, max: 10000 }).withMessage('Stock must be a whole number between 0 and 10000').toInt(),
  body('isAvailable').optional().isBoolean().withMessage('isAvailable must be true or false').toBoolean(),
];

const listRules = [
  query('category').optional().isIn(MenuItem.CATEGORIES).withMessage('Unknown category'),
  query('search').optional().trim().isLength({ max: 50 }),
  query('available').optional().isIn(['true', 'false']),
];

module.exports = { idParam, createRules, updateRules, listRules };
