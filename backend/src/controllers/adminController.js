const { body } = require("express-validator");
const User = require("../models/User");
const LearningResource = require("../models/LearningResource");
const MentorSession = require("../models/MentorSession");
const Feedback = require("../models/Feedback");
const BusinessIdea = require("../models/BusinessIdea");
const Roadmap = require("../models/Roadmap");

const verifyMentorValidation = [
  body("mentorVerified").isBoolean().withMessage("mentorVerified must be true or false.")
];

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.json({ users });
  } catch (error) {
    return next(error);
  }
};

const updateMentorVerification = async (req, res, next) => {
  try {
    const { mentorVerified } = req.body;
    const mentor = await User.findOneAndUpdate(
      { _id: req.params.userId, role: "mentor" },
      { mentorVerified },
      { new: true }
    ).select("-password");

    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found." });
    }

    return res.json({
      message: `Mentor ${mentorVerified ? "verified" : "unverified"} successfully.`,
      mentor
    });
  } catch (error) {
    return next(error);
  }
};

const getAdminStats = async (req, res, next) => {
  try {
    const [usersCount, mentorsCount, verifiedMentorsCount, ideaCount, roadmapCount, pendingResources, sessionsCount, feedbackCount] =
      await Promise.all([
        User.countDocuments({ role: "user" }),
        User.countDocuments({ role: "mentor" }),
        User.countDocuments({ role: "mentor", mentorVerified: true }),
        BusinessIdea.countDocuments(),
        Roadmap.countDocuments(),
        LearningResource.countDocuments({ status: "pending" }),
        MentorSession.countDocuments(),
        Feedback.countDocuments()
      ]);

    return res.json({
      usersCount,
      mentorsCount,
      verifiedMentorsCount,
      ideaCount,
      roadmapCount,
      pendingResources,
      sessionsCount,
      feedbackCount
    });
  } catch (error) {
    return next(error);
  }
};

const getPlatformFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.find().populate("fromUser", "name email role").sort({ createdAt: -1 });
    return res.json({ feedback });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAdminStats,
  getPlatformFeedback,
  getUsers,
  updateMentorVerification,
  verifyMentorValidation
};
