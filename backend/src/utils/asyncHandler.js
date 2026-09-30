// Wraps an async route handler so any rejected promise is passed to next(),
// which sends it to the central error handler instead of crashing the server.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
