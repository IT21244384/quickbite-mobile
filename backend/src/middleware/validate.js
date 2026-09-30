const { validationResult } = require('express-validator');

// Runs after express-validator rules. If any rule failed, stop here with
// 400 so invalid data never reaches the database.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  return res.status(400).json({
    message: errors.array()[0].msg,
    details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
  });
}

module.exports = validate;
