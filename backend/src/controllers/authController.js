const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

function signToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function publicUser(user) {
  return { _id: user._id, name: user.name, email: user.email, phone: user.phone, isAdmin: user.isAdmin };
}

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(409, 'An account with this email already exists');

  // isAdmin is never taken from the request body, so nobody can register as admin
  const user = await User.create({ name, email, phone, password });

  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // password has select:false in the schema, so ask for it explicitly
  const user = await User.findOne({ email }).select('+password');

  // Same message for "no user" and "wrong password" so attackers cannot probe emails
  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  res.json({ token: signToken(user), user: publicUser(user) });
});

// GET /api/auth/me  (protected)
const getMe = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

module.exports = { register, login, getMe };
