const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    // select: false -> the hash is never returned by queries unless asked for explicitly
    password: { type: String, required: true, minlength: 6, select: false },
    // Optional role: one boolean is enough for this system
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Hash the password before saving, but only when it was set or changed
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = function matchPassword(plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);
