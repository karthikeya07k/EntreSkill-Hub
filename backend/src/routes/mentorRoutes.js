const express = require("express");
const {
  addFollowUp,
  addFollowUpValidation,
  addSessionNote,
  addSessionNoteValidation,
  addSessionTask,
  addSessionTaskValidation,
  applyForMentor,
  applyMentorValidation,
  getMentorEngagement,
  getMentors,
  getMySessions,
  getSessionMessages,
  requestSession,
  requestSessionValidation,
  updateFollowUpStatus,
  updateFollowUpValidation,
  updateSessionStatus,
  updateSessionStatusValidation,
  updateSessionTaskStatus,
  updateSessionTaskValidation
} = require("../controllers/mentorController");
const { protect } = require("../middleware/auth");
const authorizeRoles = require("../middleware/roles");
const validate = require("../middleware/validate");

const router = express.Router();

router.get("/", getMentors);
router.post("/apply", protect, authorizeRoles("user", "mentor"), applyMentorValidation, validate, applyForMentor);
router.post("/sessions", protect, authorizeRoles("user", "admin"), requestSessionValidation, validate, requestSession);
router.get("/sessions/me", protect, authorizeRoles("user", "mentor", "admin"), getMySessions);
router.get("/sessions/:sessionId/messages", protect, authorizeRoles("user", "mentor", "admin"), getSessionMessages);
router.post(
  "/sessions/:sessionId/notes",
  protect,
  authorizeRoles("user", "mentor", "admin"),
  addSessionNoteValidation,
  validate,
  addSessionNote
);
router.post(
  "/sessions/:sessionId/tasks",
  protect,
  authorizeRoles("mentor", "admin"),
  addSessionTaskValidation,
  validate,
  addSessionTask
);
router.patch(
  "/sessions/:sessionId/tasks/:taskId",
  protect,
  authorizeRoles("user", "mentor", "admin"),
  updateSessionTaskValidation,
  validate,
  updateSessionTaskStatus
);
router.post(
  "/sessions/:sessionId/follow-ups",
  protect,
  authorizeRoles("mentor", "admin"),
  addFollowUpValidation,
  validate,
  addFollowUp
);
router.patch(
  "/sessions/:sessionId/follow-ups/:followUpId",
  protect,
  authorizeRoles("user", "mentor", "admin"),
  updateFollowUpValidation,
  validate,
  updateFollowUpStatus
);
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
