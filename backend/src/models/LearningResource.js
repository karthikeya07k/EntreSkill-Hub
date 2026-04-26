const mongoose = require("mongoose");

const learningResourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ["video", "article", "checklist"],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    topic: {
      type: String,
      default: ""
    },
    tags: {
      type: [String],
      default: []
    },
    durationMinutes: {
      type: Number,
      default: 10
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("LearningResource", learningResourceSchema);
