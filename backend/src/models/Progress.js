const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    roadmap: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Roadmap",
      required: true
    },
    completedStepOrders: {
      type: [Number],
      default: []
    },
    completionPercent: {
      type: Number,
      default: 0
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

progressSchema.index({ user: 1, roadmap: 1 }, { unique: true });

module.exports = mongoose.model("Progress", progressSchema);
