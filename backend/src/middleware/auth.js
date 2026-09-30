const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Protects a route: expects "Authorization: Bearer <token>".
// On success, the logged-in user is attached as req.user.
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    throw new ApiError(401, 'Not authorised: no token provided');
  }

  const token = header.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, 'Not authorised: token is invalid or expired');
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, 'Not authorised: user no longer exists');

  req.user = user;
  next();
});

// Must run after protect. Only lets admins through.
function adminOnly(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return next(new ApiError(403, 'Admin access required'));
  }
  next();
}

module.exports = { protect, adminOnly };
