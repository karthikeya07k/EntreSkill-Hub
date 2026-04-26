const express = require("express");
const {
  getAllProgress,
  getBookmarks,
  getDashboardStats,
  getProfile,
  getRoadmapProgress,
  toggleBookmark,
  toggleBookmarkValidation,
  updateProfile,
  updateProfileValidation
} = require("../controllers/userController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfileValidation, validate, updateProfile);
router.get("/dashboard", protect, getDashboardStats);
router.get("/bookmarks", protect, getBookmarks);
router.post("/bookmarks/toggle", protect, toggleBookmarkValidation, validate, toggleBookmark);
router.get("/progress", protect, getAllProgress);
router.get("/progress/:roadmapId", protect, getRoadmapProgress);

module.exports = router;
