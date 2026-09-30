// One-off script: creates (or promotes) the admin account.
// Usage: set ADMIN_EMAIL and ADMIN_PASSWORD in .env, then `npm run seed:admin`
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function main() {
  const { MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);

  let user = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (user) {
    user.isAdmin = true;
    await user.save();
    console.log(`Existing user ${user.email} is now an admin`);
  } else {
    user = await User.create({
      name: 'QuickBite Admin',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      isAdmin: true,
    });
    console.log(`Admin account created: ${user.email}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
