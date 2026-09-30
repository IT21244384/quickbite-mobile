// An Error that carries an HTTP status code, so controllers can simply
// `throw new ApiError(404, 'Not found')` and the error handler replies correctly.
class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

module.exports = ApiError;
