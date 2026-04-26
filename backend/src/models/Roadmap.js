const mongoose = require("mongoose");

const roadmapStepSchema = new mongoose.Schema(
  {
    order: {
      type: Number,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    durationDays: {
      type: Number,
      default: 7
    },
    requiredSkills: {
      type: [String],
      default: []
    },
    requiredTools: {
      type: [String],
      default: []
    },
    legalSteps: {
      type: [String],
      default: []
    },
    marketingTips: {
      type: [String],
      default: []
    }
  },
  { _id: false }
);

const roadmapSchema = new mongoose.Schema(
  {
    businessIdea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessIdea",
      required: true,
      unique: true
    },
    title: {
      type: String,
      required: true
    },
    overview: {
      type: String,
      required: true
    },
    costEstimate: {
      min: {
        type: Number,
        default: 0
      },
      max: {
        type: Number,
        default: 0
      },
      currency: {
        type: String,
        default: "INR"
      }
    },
    steps: {
      type: [roadmapStepSchema],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Roadmap", roadmapSchema);
