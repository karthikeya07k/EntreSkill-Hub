const { body } = require("express-validator");
const User = require("../models/User");
const Progress = require("../models/Progress");
const Roadmap = require("../models/Roadmap");

const updateProfileValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Name must be 2-80 characters."),
  body("location")
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Location must be 2-120 characters."),
  body("bio").optional().isLength({ max: 1000 }).withMessage("Bio must be up to 1000 characters."),
  body("skills").optional().isArray().withMessage("Skills must be an array."),
  body("interests").optional().isArray().withMessage("Interests must be an array."),
  body("expertise").optional().isArray().withMessage("Expertise must be an array."),
  body("experienceYears")
    .optional()
    .isInt({ min: 0, max: 60 })
    .withMessage("experienceYears must be between 0 and 60."),
  body("availability")
    .optional()
    .isLength({ min: 3, max: 120 })
    .withMessage("Availability must be 3-120 characters.")
];

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password").populate("bookmarks");
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      "name",
      "location",
      "bio",
      "skills",
      "interests",
      "expertise",
      "experienceYears",
      "availability"
    ];
    const updates = {};
    const normalizeStringArray = (items) =>
      [...new Set(items.map((item) => String(item).trim()).filter(Boolean))];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (["skills", "interests", "expertise"].includes(field) && Array.isArray(req.body[field])) {
          updates[field] = normalizeStringArray(req.body[field]);
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    }).select("-password");

    return res.json({
      message: "Profile updated successfully.",
      user
    });
  } catch (error) {
    return next(error);
  }
};

const toggleBookmarkValidation = [
  body("ideaId").notEmpty().withMessage("ideaId is required.")
];

const toggleBookmark = async (req, res, next) => {
  try {
    const { ideaId } = req.body;
    const user = await User.findById(req.user._id);
    const alreadyBookmarked = user.bookmarks.some((id) => id.toString() === ideaId);

    if (alreadyBookmarked) {
      user.bookmarks = user.bookmarks.filter((id) => id.toString() !== ideaId);
    } else {
      user.bookmarks.push(ideaId);
    }

    await user.save();

    return res.json({
      message: alreadyBookmarked ? "Bookmark removed." : "Idea bookmarked.",
      bookmarks: user.bookmarks
    });
  } catch (error) {
    return next(error);
  }
};

const getBookmarks = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("bookmarks");
    return res.json({ bookmarks: user.bookmarks });
  } catch (error) {
    return next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const [user, progressDocs] = await Promise.all([
      User.findById(req.user._id).select("bookmarks role mentorVerified"),
      Progress.find({ user: req.user._id }).populate("roadmap")
    ]);

    const completedRoadmaps = progressDocs.filter((item) => item.completionPercent >= 100).length;
    const avgCompletion = progressDocs.length
      ? Math.round(progressDocs.reduce((sum, item) => sum + item.completionPercent, 0) / progressDocs.length)
      : 0;

    const progress = progressDocs.map((item) => ({
      roadmapId: item.roadmap?._id,
      roadmapTitle: item.roadmap?.title || "Deleted roadmap",
      completionPercent: item.completionPercent
    }));

    return res.json({
      totalBookmarks: user.bookmarks.length,
      completedRoadmaps,
      avgCompletion,
      progress
    });
  } catch (error) {
    return next(error);
  }
};

const getAllProgress = async (req, res, next) => {
  try {
    const progressDocs = await Progress.find({ user: req.user._id }).populate({
      path: "roadmap",
      populate: {
        path: "businessIdea",
        model: "BusinessIdea"
      }
    });

    return res.json({ progress: progressDocs });
  } catch (error) {
    return next(error);
  }
};

const getRoadmapProgress = async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findById(req.params.roadmapId);

    if (!roadmap) {
      return res.status(404).json({ message: "Roadmap not found." });
    }

    const progress = await Progress.findOne({
      user: req.user._id,
      roadmap: roadmap._id
    });

    return res.json({
      progress: progress || {
        user: req.user._id,
        roadmap: roadmap._id,
        completedStepOrders: [],
        completionPercent: 0
      }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAllProgress,
  getBookmarks,
  getDashboardStats,
  getProfile,
  getRoadmapProgress,
  toggleBookmark,
  toggleBookmarkValidation,
  updateProfile,
  updateProfileValidation
};
