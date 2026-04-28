const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    lessonId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    summary: {
      type: String,
      default: ""
    },
    type: {
      type: String,
      enum: ["video", "article", "checklist", "template", "tool"],
      default: "article"
    },
    url: {
      type: String,
      required: true
    },
    sourceName: {
      type: String,
      default: ""
    },
    durationMinutes: {
      type: Number,
      default: 10
    }
  },
  { _id: false }
);

const moduleSchema = new mongoose.Schema(
  {
    moduleId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    overview: {
      type: String,
      default: ""
    },
    lessons: {
      type: [lessonSchema],
      default: []
    }
  },
  { _id: false }
);

const courseTrackSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    category: {
      type: String,
      required: true
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner"
    },
    estimatedHours: {
      type: Number,
      default: 4
    },
    description: {
      type: String,
      required: true
    },
    tags: {
      type: [String],
      default: []
    },
    linkedSkills: {
      type: [String],
      default: []
    },
    linkedInterests: {
      type: [String],
      default: []
    },
    modules: {
      type: [moduleSchema],
      default: []
    },
    published: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CourseTrack", courseTrackSchema);
