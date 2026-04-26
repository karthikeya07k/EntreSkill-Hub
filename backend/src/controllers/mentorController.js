const { body } = require("express-validator");
const MentorSession = require("../models/MentorSession");
const User = require("../models/User");
const ChatMessage = require("../models/ChatMessage");
const { getIO } = require("../config/socket");

const requestSessionValidation = [
  body("mentorId").notEmpty().withMessage("mentorId is required."),
  body("topic").trim().notEmpty().withMessage("topic is required."),
  body("scheduledAt").isISO8601().withMessage("scheduledAt must be a valid date.")
];

const updateSessionStatusValidation = [
  body("status")
    .isIn(["confirmed", "completed", "cancelled"])
    .withMessage("status must be confirmed, completed, or cancelled.")
];

const getMentors = async (req, res, next) => {
  try {
    const mentors = await User.find({
      role: "mentor",
      mentorVerified: true
    }).select("-password");

    return res.json({ mentors });
  } catch (error) {
    return next(error);
  }
};

const requestSession = async (req, res, next) => {
  try {
    const { mentorId, topic, scheduledAt } = req.body;
    const mentor = await User.findOne({ _id: mentorId, role: "mentor" });

    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found." });
    }

    const session = await MentorSession.create({
      mentor: mentorId,
      mentee: req.user._id,
      topic,
      scheduledAt: new Date(scheduledAt)
    });

    const populatedSession = await MentorSession.findById(session._id)
      .populate("mentor", "name email expertise mentorVerified")
      .populate("mentee", "name email");

    getIO().to(`user:${mentorId}`).emit("session:request", populatedSession);

    return res.status(201).json({
      message: "Mentorship session requested.",
      session: populatedSession
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "The mentor already has another active booking at this time."
      });
    }

    return next(error);
  }
};

const getMySessions = async (req, res, next) => {
  try {
    const query = req.user.role === "mentor" ? { mentor: req.user._id } : { mentee: req.user._id };
    const sessions = await MentorSession.find(query)
      .populate("mentor", "name expertise mentorVerified")
      .populate("mentee", "name email")
      .sort({ scheduledAt: 1 });

    return res.json({ sessions });
  } catch (error) {
    return next(error);
  }
};

const updateSessionStatus = async (req, res, next) => {
  try {
    const session = await MentorSession.findById(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    if (req.user.role === "mentor" && session.mentor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can update only your sessions." });
    }

    session.status = req.body.status;
    if (req.body.notes) {
      session.notes = req.body.notes;
    }

    await session.save();

    const updated = await MentorSession.findById(session._id)
      .populate("mentor", "name expertise mentorVerified")
      .populate("mentee", "name email");

    getIO().to(`user:${updated.mentor._id}`).emit("session:updated", updated);
    getIO().to(`user:${updated.mentee._id}`).emit("session:updated", updated);

    return res.json({
      message: "Session updated.",
      session: updated
    });
  } catch (error) {
    return next(error);
  }
};

const getMentorEngagement = async (req, res, next) => {
  try {
    const sessions = await MentorSession.find({ mentor: req.user._id });
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((session) => session.status === "completed").length;
    const activeSessions = sessions.filter((session) =>
      ["requested", "confirmed"].includes(session.status)
    ).length;

    return res.json({
      totalSessions,
      completedSessions,
      activeSessions,
      completionRate: totalSessions ? Math.round((completedSessions / totalSessions) * 100) : 0
    });
  } catch (error) {
    return next(error);
  }
};

const getSessionMessages = async (req, res, next) => {
  try {
    const session = await MentorSession.findById(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    const isParticipant =
      session.mentor.toString() === req.user._id.toString() ||
      session.mentee.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({ message: "You are not part of this session." });
    }

    const roomId = `session:${session._id}`;
    const messages = await ChatMessage.find({ roomId })
      .populate("sender", "name role")
      .sort({ createdAt: 1 });

    return res.json({ messages });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMentorEngagement,
  getMentors,
  getMySessions,
  getSessionMessages,
  requestSession,
  requestSessionValidation,
  updateSessionStatus,
  updateSessionStatusValidation
};
