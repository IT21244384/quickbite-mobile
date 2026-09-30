require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Fail fast if required configuration is missing
['MONGO_URI', 'JWT_SECRET'].forEach((key) => {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

connectDB(process.env.MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`QuickBite API listening on port ${PORT}`));
});
