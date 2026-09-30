const multer = require('multer');

function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Central error handler: turns every kind of error into a JSON response
// with a sensible HTTP status code.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Server error';
  let details = err.details;

  if (err instanceof multer.MulterError) {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 2 MB or smaller' : err.message;
  } else if (err.name === 'ValidationError') {
    // Mongoose schema validation
    status = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'CastError') {
    // e.g. an invalid ObjectId in the URL
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err.code === 11000) {
    // Duplicate key (unique index)
    status = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `${field} already exists`;
  }

  if (status >= 500) console.error(err);

  res.status(status).json({ message, ...(details && { details }) });
}

module.exports = { notFound, errorHandler };
