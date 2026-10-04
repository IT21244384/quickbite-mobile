// Entry point used when the API runs on Vercel.
// Vercel does not keep a server running: it calls this function for each request,
// so src/server.js (app.listen) is only used for local development.
const mongoose = require('mongoose');
const app = require('../src/app');

// A function instance is reused for later requests while it stays warm, so the
// connection promise is cached here and only the first request actually connects.
let connecting = null;

async function ensureConnection() {
  if (mongoose.connection.readyState === 1) return; // already connected

  if (!connecting) {
    connecting = mongoose
      .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
      .catch((err) => {
        connecting = null; // let the next request try again instead of caching the failure
        throw err;
      });
  }
  await connecting;
}

module.exports = async (req, res) => {
  try {
    await ensureConnection();
  } catch (err) {
    // process.exit() would be wrong here: it would kill the function, not restart a server.
    console.error('MongoDB connection failed:', err.message);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Database is unavailable, please try again' }));
    return;
  }

  return app(req, res);
};
