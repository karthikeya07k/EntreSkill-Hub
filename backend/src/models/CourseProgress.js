const mongoose = require("mongoose");

const courseProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    track: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseTrack",
      required: true
    },
    completedLessonIds: {
      type: [String],
      default: []
    },
    completionPercent: {
      type: Number,
      default: 0
    },
    lastLessonId: {
      type: String,
      default: ""
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date,
      default: null
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

courseProgressSchema.index({ user: 1, track: 1 }, { unique: true });

module.exports = mongoose.model("CourseProgress", courseProgressSchema);
