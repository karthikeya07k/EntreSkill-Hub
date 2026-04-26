const { body } = require("express-validator");
const LearningResource = require("../models/LearningResource");

const createResourceValidation = [
  body("title").trim().notEmpty().withMessage("Title is required."),
  body("description").trim().notEmpty().withMessage("Description is required."),
  body("type").isIn(["video", "article", "checklist"]).withMessage("Type must be video, article, or checklist."),
  body("url").isURL().withMessage("Valid URL is required.")
];

const updateResourceStatusValidation = [
  body("status").isIn(["approved", "rejected"]).withMessage("Status must be approved or rejected.")
];

const getApprovedResources = async (req, res, next) => {
  try {
    const { topic, type } = req.query;
    const query = { status: "approved" };

    if (topic) {
      query.topic = { $regex: topic, $options: "i" };
    }

    if (type) {
      query.type = type;
    }

    const resources = await LearningResource.find(query)
      .populate("uploadedBy", "name role mentorVerified")
      .sort({ createdAt: -1 });

    return res.json({ resources });
  } catch (error) {
    return next(error);
  }
};

const createResource = async (req, res, next) => {
  try {
    const resource = await LearningResource.create({
      ...req.body,
      uploadedBy: req.user._id,
      status: req.user.role === "admin" ? "approved" : "pending"
    });

    return res.status(201).json({
      message: "Resource submitted successfully.",
      resource
    });
  } catch (error) {
    return next(error);
  }
};

const getMyResources = async (req, res, next) => {
  try {
    const resources = await LearningResource.find({ uploadedBy: req.user._id }).sort({ createdAt: -1 });
    return res.json({ resources });
  } catch (error) {
    return next(error);
  }
};

const getPendingResources = async (req, res, next) => {
  try {
    const resources = await LearningResource.find({ status: "pending" })
      .populate("uploadedBy", "name email role")
      .sort({ createdAt: -1 });

    return res.json({ resources });
  } catch (error) {
    return next(error);
  }
};

const updateResourceStatus = async (req, res, next) => {
  try {
    const resource = await LearningResource.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!resource) {
      return res.status(404).json({ message: "Resource not found." });
    }

    return res.json({
      message: `Resource ${req.body.status}.`,
      resource
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createResource,
  createResourceValidation,
  getApprovedResources,
  getMyResources,
  getPendingResources,
  updateResourceStatus,
  updateResourceStatusValidation
};
