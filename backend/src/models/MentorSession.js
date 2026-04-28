const mongoose = require("mongoose");

const sessionNoteSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const actionTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ""
    },
    assignedTo: {
      type: String,
      enum: ["mentee", "mentor", "both"],
      default: "mentee"
    },
    dueAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "done", "blocked"],
      default: "open"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  { _id: true }
);

const followUpActionSchema = new mongoose.Schema(
  {
    summary: {
      type: String,
      required: true,
      trim: true
    },
    nextCheckInAt: {
      type: Date,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["planned", "completed", "cancelled"],
      default: "planned"
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const mentorSessionSchema = new mongoose.Schema(
  {
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    mentee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    topic: {
      type: String,
      required: true
    },
    scheduledAt: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ["requested", "confirmed", "completed", "cancelled"],
      default: "requested"
    },
    notes: {
      type: String,
      default: ""
    },
    sessionNotes: {
      type: [sessionNoteSchema],
      default: []
    },
    actionTasks: {
      type: [actionTaskSchema],
      default: []
    },
    followUpActions: {
      type: [followUpActionSchema],
      default: []
    }
  },
  { timestamps: true }
);

mentorSessionSchema.index(
  { mentor: 1, scheduledAt: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["requested", "confirmed"] }
    }
  }
);

module.exports = mongoose.model("MentorSession", mentorSessionSchema);
