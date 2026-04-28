const { body } = require("express-validator");
const User = require("../models/User");
const LearningResource = require("../models/LearningResource");
const MentorSession = require("../models/MentorSession");
const Feedback = require("../models/Feedback");
const BusinessIdea = require("../models/BusinessIdea");
const Roadmap = require("../models/Roadmap");
const CourseTrack = require("../models/CourseTrack");

const verifyMentorValidation = [
  body("status").isIn(["approved", "rejected"]).withMessage("status must be approved or rejected."),
  body("reviewNote")
    .optional()
    .isLength({ min: 5, max: 800 })
    .withMessage("reviewNote must be 5-800 characters."),
  body("rejectionReason")
    .optional()
    .isLength({ min: 5, max: 800 })
    .withMessage("rejectionReason must be 5-800 characters.")
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
    const { status, reviewNote = "", rejectionReason = "" } = req.body;
    const mentor = await User.findOne({ _id: req.params.userId, role: "mentor" }).select("-password");

    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found." });
    }

    mentor.mentorApplicationStatus = status;
    mentor.mentorVerified = status === "approved";
    mentor.mentorApplication = {
      ...(mentor.mentorApplication || {}),
      reviewedAt: new Date(),
      reviewedBy: req.user._id,
      approvalNote: status === "approved" ? reviewNote : "",
      rejectionReason: status === "rejected" ? rejectionReason : ""
    };

    await mentor.save();

    return res.json({
      message: `Mentor application ${status}.`,
      mentor
    });
  } catch (error) {
    return next(error);
  }
};

const getMentorApplications = async (req, res, next) => {
  try {
    const { status = "pending" } = req.query;
    const query = {
      role: "mentor",
      mentorApplicationStatus: status === "all" ? { $in: ["pending", "approved", "rejected"] } : status
    };

    const mentors = await User.find(query)
      .select("-password")
      .populate("mentorApplication.reviewedBy", "name email")
      .sort({ "mentorApplication.submittedAt": -1, createdAt: -1 });

    return res.json({ mentors });
  } catch (error) {
    return next(error);
  }
};

const getAdminStats = async (req, res, next) => {
  try {
    const [
      usersCount,
      mentorsCount,
      verifiedMentorsCount,
      pendingMentorApplications,
      ideaCount,
      roadmapCount,
      courseTrackCount,
      pendingResources,
      sessionsCount,
      feedbackCount
    ] =
      await Promise.all([
        User.countDocuments({ role: "user" }),
        User.countDocuments({ role: "mentor" }),
        User.countDocuments({ role: "mentor", mentorVerified: true }),
        User.countDocuments({ role: "mentor", mentorApplicationStatus: "pending" }),
        BusinessIdea.countDocuments(),
        Roadmap.countDocuments(),
        CourseTrack.countDocuments(),
        LearningResource.countDocuments({ status: "pending" }),
        MentorSession.countDocuments(),
        Feedback.countDocuments()
      ]);

    return res.json({
      usersCount,
      mentorsCount,
      verifiedMentorsCount,
      pendingMentorApplications,
      ideaCount,
      roadmapCount,
      courseTrackCount,
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
  getMentorApplications,
  getPlatformFeedback,
  getUsers,
  updateMentorVerification,
  verifyMentorValidation
};
