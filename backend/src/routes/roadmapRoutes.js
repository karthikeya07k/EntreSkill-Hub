const express = require("express");
const {
  createRoadmap,
  createRoadmapValidation,
  getRoadmapById,
  getRoadmapByIdea,
  getRoadmapInsights,
  updateRoadmap,
  updateRoadmapProgress,
  updateProgressValidation
} = require("../controllers/roadmapController");
const { protect } = require("../middleware/auth");
const authorizeRoles = require("../middleware/roles");
const validate = require("../middleware/validate");

const router = express.Router();

router.get("/idea/:ideaId", getRoadmapByIdea);
router.get("/:id", getRoadmapById);
router.get("/:roadmapId/insights", protect, getRoadmapInsights);
router.post("/", protect, authorizeRoles("admin"), createRoadmapValidation, validate, createRoadmap);
router.put("/:id", protect, authorizeRoles("admin"), updateRoadmap);
router.patch("/:roadmapId/progress", protect, updateProgressValidation, validate, updateRoadmapProgress);

module.exports = router;
