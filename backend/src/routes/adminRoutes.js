const express = require("express");
const {
  getAdminStats,
  getPlatformFeedback,
  getUsers,
  updateMentorVerification,
  verifyMentorValidation
} = require("../controllers/adminController");
const { protect } = require("../middleware/auth");
const authorizeRoles = require("../middleware/roles");
const validate = require("../middleware/validate");

const router = express.Router();

router.use(protect, authorizeRoles("admin"));

router.get("/users", getUsers);
router.get("/stats", getAdminStats);
router.get("/feedback", getPlatformFeedback);
router.patch("/mentors/:userId/verify", verifyMentorValidation, validate, updateMentorVerification);

module.exports = router;
