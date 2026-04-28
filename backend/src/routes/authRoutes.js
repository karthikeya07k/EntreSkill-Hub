const express = require("express");
const {
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
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const createRateLimiter = require("../middleware/rateLimit");
const validate = require("../middleware/validate");

const router = express.Router();
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyPrefix: "auth"
});
const otpLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 8,
  keyPrefix: "auth-otp"
});
const resetLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 8,
  keyPrefix: "auth-reset"
});

router.post("/register", authLimiter, registerValidation, validate, register);
router.post("/login", authLimiter, loginValidation, validate, login);
router.post("/verify-email", otpLimiter, verifyEmailValidation, validate, verifyEmail);
router.post("/resend-verification", otpLimiter, resendVerificationValidation, validate, resendVerification);
router.post("/forgot-password", resetLimiter, forgotPasswordValidation, validate, forgotPassword);
router.post("/reset-password", resetLimiter, resetPasswordValidation, validate, resetPassword);
router.get("/me", protect, me);

module.exports = router;
