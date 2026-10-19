// Log server errors and return a consistent API error response.
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const status = Number.isInteger(err.status) ? err.status : 500;
  if (status >= 500) {
    console.error(err);
  }
  return res.status(status).json({
    success: false,
    message: status >= 500 ? "Something went wrong. Please try again." : err.message,
  });
};

export default errorHandler;
