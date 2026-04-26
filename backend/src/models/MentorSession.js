const mongoose = require("mongoose");

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
