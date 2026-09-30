const { body } = require('express-validator');

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ max: 60 }).withMessage('Name must be 60 characters or fewer'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('phone').optional({ checkFalsy: true }).trim()
    .matches(/^(\+94|0)\d{9}$/).withMessage('Phone must look like 0771234567 or +94771234567'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

module.exports = { registerRules, loginRules };
