const express = require("express");
const {
  createIdea,
  createIdeaValidation,
  getIdeaById,
  getIdeas,
  getRecommendedIdeas,
  updateIdea
} = require("../controllers/ideaController");
const { protect } = require("../middleware/auth");
const authorizeRoles = require("../middleware/roles");
const validate = require("../middleware/validate");

const router = express.Router();

router.get("/", getIdeas);
router.get("/recommended", protect, getRecommendedIdeas);
router.get("/:id", getIdeaById);
router.post("/", protect, authorizeRoles("admin"), createIdeaValidation, validate, createIdea);
router.put("/:id", protect, authorizeRoles("admin"), updateIdea);

module.exports = router;
