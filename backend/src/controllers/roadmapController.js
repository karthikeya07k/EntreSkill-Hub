const { body } = require("express-validator");
const Roadmap = require("../models/Roadmap");
const Progress = require("../models/Progress");
const BusinessIdea = require("../models/BusinessIdea");

const createRoadmapValidation = [
  body("businessIdea").notEmpty().withMessage("businessIdea is required."),
  body("title").notEmpty().withMessage("title is required."),
  body("overview").notEmpty().withMessage("overview is required."),
  body("steps").isArray({ min: 1 }).withMessage("At least one step is required.")
];

const updateProgressValidation = [
  body("stepOrder").isInt({ min: 1 }).withMessage("stepOrder must be a positive number."),
  body("completed").isBoolean().withMessage("completed must be true/false.")
];

const getRoadmapByIdea = async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findOne({ businessIdea: req.params.ideaId }).populate("businessIdea");

    if (!roadmap) {
      return res.status(404).json({ message: "Roadmap not found for this idea." });
    }

    return res.json({ roadmap });
  } catch (error) {
    return next(error);
  }
};

const getRoadmapById = async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id).populate("businessIdea");

    if (!roadmap) {
      return res.status(404).json({ message: "Roadmap not found." });
    }

    return res.json({ roadmap });
  } catch (error) {
    return next(error);
  }
};

const createRoadmap = async (req, res, next) => {
  try {
    const businessIdeaExists = await BusinessIdea.findById(req.body.businessIdea);

    if (!businessIdeaExists) {
      return res.status(404).json({ message: "Business idea not found." });
    }

    const roadmap = await Roadmap.create(req.body);
    return res.status(201).json({ message: "Roadmap created.", roadmap });
  } catch (error) {
    return next(error);
  }
};

const updateRoadmap = async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!roadmap) {
      return res.status(404).json({ message: "Roadmap not found." });
    }

    return res.json({ message: "Roadmap updated.", roadmap });
  } catch (error) {
    return next(error);
  }
};

const updateRoadmapProgress = async (req, res, next) => {
  try {
    const { stepOrder, completed } = req.body;
    const roadmap = await Roadmap.findById(req.params.roadmapId);

    if (!roadmap) {
      return res.status(404).json({ message: "Roadmap not found." });
    }

    const maxStep = roadmap.steps.length;

    if (stepOrder > maxStep) {
      return res.status(400).json({ message: "Invalid step order." });
    }

    let progress = await Progress.findOne({
      user: req.user._id,
      roadmap: roadmap._id
    });

    if (!progress) {
      progress = await Progress.create({
        user: req.user._id,
        roadmap: roadmap._id,
        completedStepOrders: [],
        completionPercent: 0
      });
    }

    if (completed) {
      if (!progress.completedStepOrders.includes(stepOrder)) {
        progress.completedStepOrders.push(stepOrder);
      }
    } else {
      progress.completedStepOrders = progress.completedStepOrders.filter((step) => step !== stepOrder);
    }

    progress.completedStepOrders = [...new Set(progress.completedStepOrders)].sort((a, b) => a - b);
    progress.completionPercent = Math.round((progress.completedStepOrders.length / maxStep) * 100);
    progress.lastAccessedAt = new Date();

    await progress.save();

    return res.json({
      message: "Roadmap progress updated.",
      progress
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createRoadmap,
  createRoadmapValidation,
  getRoadmapById,
  getRoadmapByIdea,
  updateRoadmap,
  updateRoadmapProgress,
  updateProgressValidation
};
