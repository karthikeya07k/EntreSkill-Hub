const { body } = require("express-validator");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const {
  addMinutes,
  generateNumericCode,
  generateSecureToken,
  getPasswordPolicyMessage,
  hashValue,
  isStrongPassword,
  normalizeEmail
} = require("../utils/security");
const { sendPasswordResetEmail, sendVerificationCodeEmail } = require("../services/emailService");

const LOGIN_MAX_ATTEMPTS = Number(process.env.LOGIN_MAX_ATTEMPTS || 5);
const LOGIN_LOCK_MINUTES = Number(process.env.LOGIN_LOCK_MINUTES || 15);
const EMAIL_OTP_TTL_MINUTES = Number(process.env.EMAIL_OTP_TTL_MINUTES || 10);
const PASSWORD_RESET_TTL_MINUTES = Number(process.env.PASSWORD_RESET_TTL_MINUTES || 20);

const getPrimaryClientUrl = () =>
  (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)[0] || "http://localhost:5173";

const registerValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Name must be 2-80 characters."),
  body("email").isEmail().withMessage("Valid email is required."),
  body("password")
    .custom((value) => isStrongPassword(value))
    .withMessage(getPasswordPolicyMessage()),
  body("role").optional().isIn(["user", "mentor"]).withMessage("Role must be user or mentor."),
  body("motivation")
    .optional()
    .isLength({ min: 20, max: 1200 })
    .withMessage("Mentor motivation must be 20-1200 characters."),
  body("experienceSummary")
    .optional()
    .isLength({ min: 20, max: 1200 })
    .withMessage("Experience summary must be 20-1200 characters."),
  body("specialization")
    .optional()
    .isArray({ max: 20 })
    .withMessage("Specialization must be an array."),
  body("portfolioUrl").optional({ checkFalsy: true }).isURL().withMessage("Portfolio URL must be valid."),
  body("linkedinUrl").optional({ checkFalsy: true }).isURL().withMessage("LinkedIn URL must be valid."),
  body().custom((payload) => {
    if (payload.role !== "mentor") {
      return true;
    }

    if (!payload.motivation || String(payload.motivation).trim().length < 20) {
      throw new Error("Mentor motivation must be at least 20 characters.");
    }

    if (!payload.experienceSummary || String(payload.experienceSummary).trim().length < 20) {
      throw new Error("Mentor experience summary must be at least 20 characters.");
    }

    if (!Array.isArray(payload.specialization) || !payload.specialization.length) {
      throw new Error("Mentor specialization is required.");
    }

    return true;
  })
];

const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required."),
  body("password").notEmpty().withMessage("Password is required.")
];

const verifyEmailValidation = [
  body("email").isEmail().withMessage("Valid email is required."),
  body("code")
    .trim()
    .matches(/^\d{6}$/)
    .withMessage("Verification code must be 6 digits.")
];

const resendVerificationValidation = [body("email").isEmail().withMessage("Valid email is required.")];

const forgotPasswordValidation = [body("email").isEmail().withMessage("Valid email is required.")];

const resetPasswordValidation = [
  body("token").isString().notEmpty().withMessage("Reset token is required."),
  body("password")
    .custom((value) => isStrongPassword(value))
    .withMessage(getPasswordPolicyMessage())
];

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  emailVerified: Boolean(user.emailVerified),
  role: user.role,
  skills: user.skills,
  interests: user.interests,
  mentorVerified: Boolean(user.mentorVerified),
  mentorApplicationStatus: user.mentorApplicationStatus || "not_applied"
});

const applyLoginFailurePolicy = (user) => {
  const failed = (user.failedLoginAttempts || 0) + 1;
  user.failedLoginAttempts = failed;

  if (failed >= LOGIN_MAX_ATTEMPTS) {
    user.loginLockedUntil = addMinutes(LOGIN_LOCK_MINUTES);
    user.failedLoginAttempts = 0;
  }
};

const issueEmailVerificationCode = async (user) => {
  const code = generateNumericCode(6);
  user.emailVerificationCodeHash = hashValue(code);
  user.emailVerificationExpiresAt = addMinutes(EMAIL_OTP_TTL_MINUTES);
  user.emailVerificationAttempts = 0;
  await user.save();

  const mailResult = await sendVerificationCodeEmail({
    to: user.email,
    name: user.name,
    code
  });

  return {
    code,
    delivered: mailResult.delivered
  };
};

const register = async (req, res, next) => {
  try {
    const role = req.body.role === "mentor" ? "mentor" : "user";
    const email = normalizeEmail(req.body.email);
    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const mentorApplication =
      role === "mentor"
        ? {
            motivation: req.body.motivation || "",
            experienceSummary: req.body.experienceSummary || "",
            specialization: Array.isArray(req.body.specialization)
              ? req.body.specialization.map((item) => String(item).trim()).filter(Boolean)
              : [],
            portfolioUrl: req.body.portfolioUrl || "",
            linkedinUrl: req.body.linkedinUrl || "",
            submittedAt: new Date()
          }
        : {};

    const user = await User.create({
      name: req.body.name,
      email,
      password: req.body.password,
      role,
      emailVerified: false,
      mentorVerified: false,
      mentorApplicationStatus: role === "mentor" ? "pending" : "not_applied",
      mentorApplication
    });

    const verification = await issueEmailVerificationCode(user);

    const payload = {
      message: "Account created. Verify your email to continue.",
      emailVerificationRequired: true,
      user: sanitizeUser(user)
    };

    if (!verification.delivered && process.env.NODE_ENV !== "production") {
      payload.devVerificationCode = verification.code;
    }

    return res.status(201).json(payload);
  } catch (error) {
    return next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.code).trim();
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid verification request." });
    }

    if (user.emailVerified) {
      const token = generateToken(user);
      return res.json({
        message: "Email already verified.",
        token,
        user: sanitizeUser(user)
      });
    }

    if (!user.emailVerificationExpiresAt || user.emailVerificationExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: "Verification code expired. Please request a new one." });
    }

    if ((user.emailVerificationAttempts || 0) >= 6) {
      return res.status(429).json({ message: "Too many attempts. Request a new code." });
    }

    const expectedHash = user.emailVerificationCodeHash;
    const actualHash = hashValue(code);

    if (!expectedHash || expectedHash !== actualHash) {
      user.emailVerificationAttempts = (user.emailVerificationAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({ message: "Incorrect verification code." });
    }

    user.emailVerified = true;
    user.emailVerificationCodeHash = "";
    user.emailVerificationExpiresAt = null;
    user.emailVerificationAttempts = 0;
    await user.save();

    const token = generateToken(user);
    return res.json({
      message: "Email verified successfully.",
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    return next(error);
  }
};

const resendVerification = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        message: "If that email is registered, a verification code has been sent."
      });
    }

    if (user.emailVerified) {
      return res.json({ message: "Email already verified. Please log in." });
    }

    const verification = await issueEmailVerificationCode(user);
    const payload = {
      message: "Verification code sent."
    };

    if (!verification.delivered && process.env.NODE_ENV !== "production") {
      payload.devVerificationCode = verification.code;
    }

    return res.json(payload);
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (user.loginLockedUntil && user.loginLockedUntil.getTime() > Date.now()) {
      return res.status(423).json({
        message: "Account temporarily locked due to repeated failed attempts. Try again later."
      });
    }

    const validPassword = await user.comparePassword(password);

    if (!validPassword) {
      applyLoginFailurePolicy(user);
      await user.save();
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (!user.emailVerified) {
      const verification = await issueEmailVerificationCode(user);
      const payload = {
        message: "Email is not verified. A new verification code was sent.",
        emailVerificationRequired: true
      };

      if (!verification.delivered && process.env.NODE_ENV !== "production") {
        payload.devVerificationCode = verification.code;
      }

      return res.status(403).json(payload);
    }

    user.failedLoginAttempts = 0;
    user.loginLockedUntil = null;
    await user.save();

    const token = generateToken(user);

    return res.json({
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    return next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        message: "If that email is registered, you will receive a password reset link."
      });
    }

    const resetToken = generateSecureToken(24);
    user.passwordResetTokenHash = hashValue(resetToken);
    user.passwordResetExpiresAt = addMinutes(PASSWORD_RESET_TTL_MINUTES);
    await user.save();

    const clientUrl = getPrimaryClientUrl();
    const resetLink = `${clientUrl.replace(/\/$/, "")}/reset-password?token=${resetToken}&email=${encodeURIComponent(
      user.email
    )}`;

    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetLink
    });

    const payload = {
      message: "If that email is registered, you will receive a password reset link."
    };

    if (process.env.NODE_ENV !== "production" && !process.env.SMTP_HOST) {
      payload.devResetLink = resetLink;
    }

    return res.json(payload);
  } catch (error) {
    return next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const token = String(req.body.token || "").trim();
    const hashed = hashValue(token);
    const user = await User.findOne({
      passwordResetTokenHash: hashed,
      passwordResetExpiresAt: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or expired." });
    }

    user.password = req.body.password;
    user.passwordResetTokenHash = "";
    user.passwordResetExpiresAt = null;
    user.failedLoginAttempts = 0;
    user.loginLockedUntil = null;
    await user.save();

    return res.json({ message: "Password reset successful. Please log in." });
  } catch (error) {
    return next(error);
  }
};

const me = async (req, res) =>
  res.json({
    user: sanitizeUser(req.user)
  });

module.exports = {
  forgotPassword,
  forgotPasswordValidation,
  login,
  loginValidation,
  me,
  register,
  registerValidation,
  resendVerification,
  resendVerificationValidation,
  resetPassword,
  resetPasswordValidation,
  verifyEmail,
  verifyEmailValidation
};
