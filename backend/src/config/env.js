const DEFAULT_CLIENT_ORIGIN = "http://localhost:5173";

const parseAllowedOrigins = () => {
  const configured = process.env.CLIENT_URL || DEFAULT_CLIENT_ORIGIN;

  return [...new Set(configured.split(",").map((origin) => origin.trim()).filter(Boolean))];
};

const wildcardToRegex = (pattern) => {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`);
};

const isOriginAllowed = (origin, allowedOrigins = []) => {
  if (!origin) {
    return true;
  }

  return allowedOrigins.some((candidate) => {
    if (candidate === "*") {
      return true;
    }

    if (candidate.includes("*")) {
      return wildcardToRegex(candidate).test(origin);
    }

    return candidate === origin;
  });
};

const getCorsOptions = () => {
  const allowedOrigins = parseAllowedOrigins();

  return {
    allowedOrigins,
    cors: {
      origin(origin, callback) {
        if (isOriginAllowed(origin, allowedOrigins)) {
          return callback(null, true);
        }

        return callback(new Error("CORS policy blocks this origin."));
      },
      credentials: true
    }
  };
};

const assertRequiredEnv = () => {
  const required = ["MONGODB_URI", "JWT_SECRET"];
  const missing = required.filter((key) => !process.env[key] || !process.env[key].trim());

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (
    process.env.NODE_ENV === "production" &&
    (process.env.JWT_SECRET === "entreskill_local_jwt_secret_change_me" ||
      process.env.JWT_SECRET === "your_super_secret_key")
  ) {
    throw new Error("JWT_SECRET must be a strong unique value in production.");
  }
};

module.exports = {
  assertRequiredEnv,
  getCorsOptions,
  isOriginAllowed,
  parseAllowedOrigins
};
