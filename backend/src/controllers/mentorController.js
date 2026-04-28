const { body } = require("express-validator");
const MentorSession = require("../models/MentorSession");
const User = require("../models/User");
const ChatMessage = require("../models/ChatMessage");
const { getIO } = require("../config/socket");

const applyMentorValidation = [
  body("motivation")
    .trim()
    .isLength({ min: 20, max: 1200 })
    .withMessage("Motivation must be 20-1200 characters."),
  body("experienceSummary")
    .trim()
    .isLength({ min: 20, max: 1200 })
    .withMessage("Experience summary must be 20-1200 characters."),
  body("specialization")
    .isArray({ min: 1, max: 20 })
    .withMessage("Specialization is required."),
  body("portfolioUrl").optional({ checkFalsy: true }).isURL().withMessage("Portfolio URL must be valid."),
  body("linkedinUrl").optional({ checkFalsy: true }).isURL().withMessage("LinkedIn URL must be valid."),
  body("availability")
    .optional()
    .isLength({ min: 3, max: 120 })
    .withMessage("Availability must be 3-120 characters.")
];

const requestSessionValidation = [
  body("mentorId").notEmpty().withMessage("mentorId is required."),
  body("topic").trim().notEmpty().withMessage("topic is required."),
  body("scheduledAt")
    .isISO8601()
    .withMessage("scheduledAt must be a valid date.")
    .custom((value) => {
      if (new Date(value).getTime() <= Date.now()) {
        throw new Error("scheduledAt must be in the future.");
      }
      return true;
    })
];

const updateSessionStatusValidation = [
  body("status")
    .isIn(["confirmed", "completed", "cancelled"])
    .withMessage("status must be confirmed, completed, or cancelled.")
];

const addSessionNoteValidation = [
  body("text").trim().isLength({ min: 4, max: 1200 }).withMessage("Note must be 4-1200 characters.")
];

const addSessionTaskValidation = [
  body("title").trim().isLength({ min: 3, max: 200 }).withMessage("Task title must be 3-200 characters."),
  body("description").optional().isLength({ max: 1000 }).withMessage("Task description is too long."),
  body("assignedTo")
    .optional()
    .isIn(["mentee", "mentor", "both"])
    .withMessage("assignedTo must be mentee, mentor, or both."),
  body("dueAt").optional({ checkFalsy: true }).isISO8601().withMessage("dueAt must be a valid date.")
];

const updateSessionTaskValidation = [
  body("status")
    .isIn(["open", "in_progress", "done", "blocked"])
    .withMessage("status must be open, in_progress, done, or blocked.")
];

const addFollowUpValidation = [
  body("summary").trim().isLength({ min: 4, max: 500 }).withMessage("Summary must be 4-500 characters."),
  body("nextCheckInAt")
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage("nextCheckInAt must be a valid date.")
];

const updateFollowUpValidation = [
  body("status").isIn(["planned", "completed", "cancelled"]).withMessage("Invalid follow-up status.")
];

const ensureSessionParticipant = (session, userId) =>
  session.mentor.toString() === userId.toString() || session.mentee.toString() === userId.toString();

const loadSessionOrFail = async (sessionId) => MentorSession.findById(sessionId);

const applyForMentor = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.mentorApplicationStatus === "pending") {
      return res.status(409).json({ message: "Your mentor application is already under review." });
    }

    if (user.mentorApplicationStatus === "approved" && user.mentorVerified) {
      return res.status(409).json({ message: "Your mentor profile is already approved." });
    }

    user.role = "mentor";
    user.mentorVerified = false;
    user.mentorApplicationStatus = "pending";
    user.expertise = req.body.specialization.map((item) => String(item).trim()).filter(Boolean);
    user.availability = req.body.availability || user.availability || "Weekdays";
    user.mentorApplication = {
      motivation: req.body.motivation,
      experienceSummary: req.body.experienceSummary,
      specialization: req.body.specialization.map((item) => String(item).trim()).filter(Boolean),
      portfolioUrl: req.body.portfolioUrl || "",
      linkedinUrl: req.body.linkedinUrl || "",
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      approvalNote: "",
      rejectionReason: ""
    };

    await user.save();

    return res.status(201).json({
      message: "Mentor application submitted. Admin review is pending.",
      user: {
        id: user._id,
        role: user.role,
        mentorVerified: user.mentorVerified,
        mentorApplicationStatus: user.mentorApplicationStatus
      }
    });
  } catch (error) {
    return next(error);
  }
};

const getMentors = async (req, res, next) => {
  try {
    const mentors = await User.find({
      role: "mentor",
      mentorVerified: true,
      mentorApplicationStatus: "approved"
    }).select("-password");

    return res.json({ mentors });
  } catch (error) {
    return next(error);
  }
};

const requestSession = async (req, res, next) => {
  try {
    const { mentorId, topic, scheduledAt } = req.body;
    const mentor = await User.findOne({
      _id: mentorId,
      role: "mentor",
      mentorVerified: true,
      mentorApplicationStatus: "approved"
    });

    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found or not verified yet." });
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
    const query =
      req.user.role === "admin"
        ? {}
        : req.user.role === "mentor"
          ? { mentor: req.user._id }
          : { mentee: req.user._id };
    const sessions = await MentorSession.find(query)
      .populate("mentor", "name expertise mentorVerified")
      .populate("mentee", "name email")
      .populate("sessionNotes.author", "name role")
      .populate("actionTasks.createdBy", "name role")
      .populate("followUpActions.createdBy", "name role")
      .sort({ scheduledAt: 1 });

    return res.json({ sessions });
  } catch (error) {
    return next(error);
  }
};

const updateSessionStatus = async (req, res, next) => {
  try {
    const session = await loadSessionOrFail(req.params.sessionId);

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
      .populate("mentee", "name email")
      .populate("sessionNotes.author", "name role")
      .populate("actionTasks.createdBy", "name role")
      .populate("followUpActions.createdBy", "name role");

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

const addSessionNote = async (req, res, next) => {
  try {
    const session = await loadSessionOrFail(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    if (!ensureSessionParticipant(session, req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "You are not part of this session." });
    }

    session.sessionNotes.push({
      author: req.user._id,
      text: req.body.text
    });
    await session.save();

    const updated = await MentorSession.findById(session._id).populate("sessionNotes.author", "name role");

    return res.status(201).json({
      message: "Session note added.",
      notes: updated.sessionNotes
    });
  } catch (error) {
    return next(error);
  }
};

const addSessionTask = async (req, res, next) => {
  try {
    const session = await loadSessionOrFail(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    if (
      req.user.role !== "admin" &&
      (req.user.role !== "mentor" || session.mentor.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ message: "Only assigned mentor can add tasks." });
    }

    session.actionTasks.push({
      title: req.body.title,
      description: req.body.description || "",
      assignedTo: req.body.assignedTo || "mentee",
      dueAt: req.body.dueAt ? new Date(req.body.dueAt) : null,
      createdBy: req.user._id
    });
    await session.save();

    const updated = await MentorSession.findById(session._id).populate("actionTasks.createdBy", "name role");

    return res.status(201).json({
      message: "Action task created.",
      tasks: updated.actionTasks
    });
  } catch (error) {
    return next(error);
  }
};

const updateSessionTaskStatus = async (req, res, next) => {
  try {
    const session = await loadSessionOrFail(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    if (!ensureSessionParticipant(session, req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "You are not part of this session." });
    }

    const task = session.actionTasks.id(req.params.taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    task.status = req.body.status;
    task.completedAt = req.body.status === "done" ? new Date() : null;
    await session.save();

    return res.json({
      message: "Task status updated.",
      task
    });
  } catch (error) {
    return next(error);
  }
};

const addFollowUp = async (req, res, next) => {
  try {
    const session = await loadSessionOrFail(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    if (
      req.user.role !== "admin" &&
      (req.user.role !== "mentor" || session.mentor.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ message: "Only mentor can create follow-up actions." });
    }

    session.followUpActions.push({
      summary: req.body.summary,
      nextCheckInAt: req.body.nextCheckInAt ? new Date(req.body.nextCheckInAt) : null,
      createdBy: req.user._id
    });
    await session.save();

    const updated = await MentorSession.findById(session._id).populate("followUpActions.createdBy", "name role");

    return res.status(201).json({
      message: "Follow-up action added.",
      followUps: updated.followUpActions
    });
  } catch (error) {
    return next(error);
  }
};

const updateFollowUpStatus = async (req, res, next) => {
  try {
    const session = await loadSessionOrFail(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    if (!ensureSessionParticipant(session, req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "You are not part of this session." });
    }

    const followUp = session.followUpActions.id(req.params.followUpId);
    if (!followUp) {
      return res.status(404).json({ message: "Follow-up action not found." });
    }

    followUp.status = req.body.status;
    await session.save();

    return res.json({
      message: "Follow-up status updated.",
      followUp
    });
  } catch (error) {
    return next(error);
  }
};

const getMentorEngagement = async (req, res, next) => {
  try {
    const sessions = await MentorSession.find({ mentor: req.user._id })
      .select("mentee topic status scheduledAt createdAt actionTasks followUpActions")
      .sort({ scheduledAt: 1 })
      .lean();

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((session) => session.status === "completed").length;
    const activeSessions = sessions.filter((session) =>
      ["requested", "confirmed"].includes(session.status)
    ).length;
    const requestedSessions = sessions.filter((session) => session.status === "requested").length;
    const confirmedSessions = sessions.filter((session) => session.status === "confirmed").length;
    const cancelledSessions = sessions.filter((session) => session.status === "cancelled").length;
    const completionRate = totalSessions ? Math.round((completedSessions / totalSessions) * 100) : 0;

    const now = Date.now();
    const next7Days = now + 7 * 24 * 60 * 60 * 1000;
    const upcomingSessions = sessions.filter((session) => {
      const scheduled = new Date(session.scheduledAt).getTime();
      return scheduled >= now && scheduled <= next7Days && ["requested", "confirmed"].includes(session.status);
    }).length;

    const uniqueMenteeIds = [...new Set(sessions.map((session) => session.mentee.toString()))];
    const uniqueMentees = uniqueMenteeIds.length;
    const menteeSessionCount = sessions.reduce((acc, session) => {
      const key = session.mentee.toString();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const repeatMentees = Object.values(menteeSessionCount).filter((count) => count > 1).length;

    const averageLeadTimeHours = totalSessions
      ? Math.round(
          (sessions.reduce((acc, session) => {
            const leadTime = new Date(session.scheduledAt).getTime() - new Date(session.createdAt).getTime();
            return acc + Math.max(0, leadTime);
          }, 0) /
            totalSessions /
            (1000 * 60 * 60)) *
            10
        ) / 10
      : 0;

    const roomIds = sessions.map((session) => `session:${session._id}`);
    const messageDocs = roomIds.length
      ? await ChatMessage.find({ roomId: { $in: roomIds } }).select("roomId createdAt").lean()
      : [];

    const roomMessageCount = messageDocs.reduce((acc, item) => {
      acc[item.roomId] = (acc[item.roomId] || 0) + 1;
      return acc;
    }, {});

    const totalMessages = messageDocs.length;
    const sessionsWithMessages = Object.keys(roomMessageCount).length;
    const avgMessagesPerSession = totalSessions
      ? Math.round((totalMessages / totalSessions) * 10) / 10
      : 0;

    const mentees = uniqueMenteeIds.length
      ? await User.find({ _id: { $in: uniqueMenteeIds } }).select("name").lean()
      : [];
    const menteeNameMap = mentees.reduce((acc, user) => {
      acc[user._id.toString()] = user.name;
      return acc;
    }, {});

    const mostActiveConversations = sessions
      .map((session) => {
        const roomId = `session:${session._id}`;
        return {
          sessionId: session._id,
          topic: session.topic,
          menteeName: menteeNameMap[session.mentee.toString()] || "Mentee",
          messageCount: roomMessageCount[roomId] || 0
        };
      })
      .filter((session) => session.messageCount > 0)
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(0, 5);

    const monthlyTrendMap = {};
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date();
      date.setMonth(date.getMonth() - i, 1);
      date.setHours(0, 0, 0, 0);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyTrendMap[key] = 0;
    }

    sessions.forEach((session) => {
      const d = new Date(session.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (Object.prototype.hasOwnProperty.call(monthlyTrendMap, key)) {
        monthlyTrendMap[key] += 1;
      }
    });

    const monthlyTrend = Object.entries(monthlyTrendMap).map(([month, sessionsCount]) => ({
      month,
      sessionsCount
    }));

    const totalTasks = sessions.reduce((acc, session) => acc + (session.actionTasks?.length || 0), 0);
    const completedTasks = sessions.reduce(
      (acc, session) =>
        acc + (session.actionTasks?.filter((task) => task.status === "done").length || 0),
      0
    );
    const followUpActions = sessions.reduce((acc, session) => acc + (session.followUpActions?.length || 0), 0);
    const completedFollowUps = sessions.reduce(
      (acc, session) =>
        acc + (session.followUpActions?.filter((item) => item.status === "completed").length || 0),
      0
    );

    return res.json({
      totalSessions,
      completedSessions,
      activeSessions,
      completionRate,
      requestedSessions,
      confirmedSessions,
      cancelledSessions,
      upcomingSessions,
      uniqueMentees,
      repeatMentees,
      averageLeadTimeHours,
      totalMessages,
      sessionsWithMessages,
      avgMessagesPerSession,
      totalTasks,
      completedTasks,
      followUpActions,
      completedFollowUps,
      monthlyTrend,
      mostActiveConversations
    });
  } catch (error) {
    return next(error);
  }
};

const getSessionMessages = async (req, res, next) => {
  try {
    const session = await loadSessionOrFail(req.params.sessionId);

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
  addFollowUp,
  addFollowUpValidation,
  addSessionNote,
  addSessionNoteValidation,
  addSessionTask,
  addSessionTaskValidation,
  applyForMentor,
  applyMentorValidation,
  getMentorEngagement,
  getMentors,
  getMySessions,
  getSessionMessages,
  requestSession,
  requestSessionValidation,
  updateFollowUpStatus,
  updateFollowUpValidation,
  updateSessionStatus,
  updateSessionStatusValidation,
  updateSessionTaskStatus,
  updateSessionTaskValidation
};
