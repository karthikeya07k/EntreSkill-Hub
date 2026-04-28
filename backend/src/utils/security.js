const crypto = require("crypto");

const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

const hashValue = (value) =>
  crypto
    .createHash("sha256")
    .update(String(value))
    .digest("hex");

const generateNumericCode = (length = 6) => {
  const bytes = crypto.randomBytes(length);
  const digits = [];
  for (let i = 0; i < length; i += 1) {
    digits.push(String(bytes[i] % 10));
  }
  return digits.join("");
};

const generateSecureToken = (bytes = 32) => crypto.randomBytes(bytes).toString("hex");

const isStrongPassword = (password = "") => PASSWORD_POLICY.test(password);

const getPasswordPolicyMessage = () =>
  "Password must be 8-64 characters and include uppercase, lowercase, number, and special character.";

const addMinutes = (minutes) => new Date(Date.now() + minutes * 60 * 1000);

const maskEmail = (email = "") => {
  const normalized = normalizeEmail(email);
  const [name = "", domain = ""] = normalized.split("@");
  if (!name || !domain) return normalized;

  const visible = name.slice(0, 2);
  const hidden = "*".repeat(Math.max(2, name.length - 2));
  return `${visible}${hidden}@${domain}`;
};

module.exports = {
  addMinutes,
  generateNumericCode,
  generateSecureToken,
  getPasswordPolicyMessage,
  hashValue,
  isStrongPassword,
  maskEmail,
  normalizeEmail
};
