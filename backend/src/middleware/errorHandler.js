const errorHandler = (err, req, res, next) => {
  const isProd = process.env.NODE_ENV === "production";
  const statusCode = err.statusCode || (err.name === "ValidationError" ? 400 : 500);

  if (!isProd) {
    console.error(err);
  }

  if (err.code === 11000) {
    return res.status(409).json({
      message: "A record with the same unique value already exists."
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      message: "Invalid resource identifier."
    });
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      message: "Session expired. Please login again."
    });
  }

  res.status(statusCode).json({
    message: statusCode >= 500 && isProd ? "Internal server error." : err.message || "Internal server error."
  });
};

module.exports = errorHandler;
