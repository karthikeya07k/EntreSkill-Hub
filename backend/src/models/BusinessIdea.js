const mongoose = require("mongoose");

const businessIdeaSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    matchedSkills: {
      type: [String],
      default: []
    },
    matchedInterests: {
      type: [String],
      default: []
    },
    estimatedInvestment: {
      type: String,
      default: "Low"
    },
    marketPotential: {
      type: String,
      default: "Local"
    },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner"
    },
    tags: {
      type: [String],
      default: []
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("BusinessIdea", businessIdeaSchema);
