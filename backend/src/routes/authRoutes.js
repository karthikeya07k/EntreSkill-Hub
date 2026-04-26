const express = require("express");
const {
  login,
  loginValidation,
  me,
  register,
  registerValidation
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();

router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);
router.get("/me", protect, me);

module.exports = router;
