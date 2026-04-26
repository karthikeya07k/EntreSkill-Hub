const express = require("express");
const {
  createFeedback,
  createFeedbackValidation,
  getMyFeedback
} = require("../controllers/feedbackController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();

router.use(protect);
router.get("/me", getMyFeedback);
router.post("/", createFeedbackValidation, validate, createFeedback);

module.exports = router;
