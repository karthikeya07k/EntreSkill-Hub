const buckets = new Map();

const createRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 20, keyPrefix = "default" } = {}) => {
  const pruneBefore = () => {
    const now = Date.now();

    for (const [key, bucket] of buckets.entries()) {
      if (bucket.expiresAt <= now) {
        buckets.delete(key);
      }
    }
  };

  return (req, res, next) => {
    pruneBefore();

    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || existing.expiresAt <= now) {
      buckets.set(key, {
        count: 1,
        expiresAt: now + windowMs
      });
      return next();
    }

    existing.count += 1;

    if (existing.count > max) {
      const retryAfterSec = Math.max(1, Math.ceil((existing.expiresAt - now) / 1000));
      res.setHeader("Retry-After", retryAfterSec);
      return res.status(429).json({
        message: "Too many requests. Please try again later."
      });
    }

    return next();
  };
};

module.exports = createRateLimiter;
