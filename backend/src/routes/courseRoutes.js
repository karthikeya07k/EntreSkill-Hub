const express = require("express");
const {
  createTrack,
  createTrackValidation,
  getMyCourseProgress,
  getRecommendedTracks,
  getTrackById,
  getTracks,
  updateCourseProgress,
  updateCourseProgressValidation,
  updateTrack,
  updateTrackPublish,
  updateTrackPublishValidation,
  updateTrackValidation
} = require("../controllers/courseController");
const { protect } = require("../middleware/auth");
const authorizeRoles = require("../middleware/roles");
const validate = require("../middleware/validate");

const router = express.Router();

router.use(protect);

router.get("/tracks", getTracks);
router.get("/tracks/recommended", getRecommendedTracks);
router.get("/tracks/:trackId", getTrackById);
router.patch("/tracks/:trackId/progress", updateCourseProgressValidation, validate, updateCourseProgress);
router.get("/progress/me", getMyCourseProgress);

router.post("/tracks", authorizeRoles("admin"), createTrackValidation, validate, createTrack);
router.put("/tracks/:trackId", authorizeRoles("admin"), updateTrackValidation, validate, updateTrack);
router.patch(
  "/tracks/:trackId/publish",
  authorizeRoles("admin"),
  updateTrackPublishValidation,
  validate,
  updateTrackPublish
);

module.exports = router;
