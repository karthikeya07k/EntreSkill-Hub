const { body } = require("express-validator");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required."),
  body("email").isEmail().withMessage("Valid email is required."),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters."),
  body("role").optional().isIn(["user", "mentor"]).withMessage("Role must be user or mentor.")
];

const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required."),
  body("password").notEmpty().withMessage("Password is required.")
];

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  skills: user.skills,
  interests: user.interests,
  mentorVerified: user.mentorVerified
});

const register = async (req, res, next) => {
  try {
    const { name, email, password, role = "user" } = req.body;
    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const user = await User.create({ name, email, password, role });
    const token = generateToken(user);

    return res.status(201).json({
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = generateToken(user);

    return res.json({
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    return next(error);
  }
};

const me = async (req, res) =>
  res.json({
    user: sanitizeUser(req.user)
  });

module.exports = {
  login,
  loginValidation,
  me,
  register,
  registerValidation
};
