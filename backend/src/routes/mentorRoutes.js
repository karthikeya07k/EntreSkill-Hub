const express = require("express");
const {
  getMentorEngagement,
  getMentors,
  getMySessions,
  getSessionMessages,
  requestSession,
  requestSessionValidation,
  updateSessionStatus,
  updateSessionStatusValidation
} = require("../controllers/mentorController");
const { protect } = require("../middleware/auth");
const authorizeRoles = require("../middleware/roles");
const validate = require("../middleware/validate");

const router = express.Router();

router.get("/", getMentors);
router.post("/sessions", protect, authorizeRoles("user", "admin"), requestSessionValidation, validate, requestSession);
router.get("/sessions/me", protect, authorizeRoles("user", "mentor", "admin"), getMySessions);
router.get("/sessions/:sessionId/messages", protect, authorizeRoles("user", "mentor", "admin"), getSessionMessages);
router.patch(
  "/sessions/:sessionId/status",
  protect,
  authorizeRoles("mentor", "admin"),
  updateSessionStatusValidation,
  validate,
  updateSessionStatus
);
router.get("/engagement/me", protect, authorizeRoles("mentor", "admin"), getMentorEngagement);

module.exports = router;
