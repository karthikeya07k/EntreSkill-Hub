const { body } = require("express-validator");
const Feedback = require("../models/Feedback");

const createFeedbackValidation = [
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5."),
  body("comment").optional().isString().withMessage("Comment must be text."),
  body("type").optional().isIn(["platform", "mentor", "resource"]).withMessage("Invalid feedback type.")
];

const createFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.create({
      ...req.body,
      fromUser: req.user._id
    });

    return res.status(201).json({
      message: "Feedback submitted successfully.",
      feedback
    });
  } catch (error) {
    return next(error);
  }
};

const getMyFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.find({ fromUser: req.user._id }).sort({ createdAt: -1 });
    return res.json({ feedback });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createFeedback,
  createFeedbackValidation,
  getMyFeedback
};
