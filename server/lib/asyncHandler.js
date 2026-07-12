// Express 4 doesn't catch rejected promises from async route handlers, which would
// otherwise hang the request instead of reaching the error-handling middleware.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { asyncHandler };
