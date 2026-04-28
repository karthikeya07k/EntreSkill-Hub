const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const mentorApplicationSchema = new mongoose.Schema(
  {
    motivation: {
      type: String,
      default: ""
    },
    experienceSummary: {
      type: String,
      default: ""
    },
    specialization: {
      type: [String],
      default: []
    },
    portfolioUrl: {
      type: String,
      default: ""
    },
    linkedinUrl: {
      type: String,
      default: ""
    },
    resumeUrl: {
      type: String,
      default: ""
    },
    submittedAt: {
      type: Date,
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    approvalNote: {
      type: String,
      default: ""
    },
    rejectionReason: {
      type: String,
      default: ""
    }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationCodeHash: {
      type: String,
      default: ""
    },
    emailVerificationExpiresAt: {
      type: Date,
      default: null
    },
    emailVerificationAttempts: {
      type: Number,
      default: 0
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    role: {
      type: String,
      enum: ["user", "mentor", "admin"],
      default: "user"
    },
    location: {
      type: String,
      default: ""
    },
    bio: {
      type: String,
      default: ""
    },
    skills: {
      type: [String],
      default: []
    },
    interests: {
      type: [String],
      default: []
    },
    expertise: {
      type: [String],
      default: []
    },
    mentorVerified: {
      type: Boolean,
      default: false
    },
    mentorApplicationStatus: {
      type: String,
      enum: ["not_applied", "pending", "approved", "rejected"],
      default: "not_applied"
    },
    mentorApplication: {
      type: mentorApplicationSchema,
      default: () => ({})
    },
    experienceYears: {
      type: Number,
      default: 0
    },
    availability: {
      type: String,
      default: "Weekdays"
    },
    failedLoginAttempts: {
      type: Number,
      default: 0
    },
    loginLockedUntil: {
      type: Date,
      default: null
    },
    passwordResetTokenHash: {
      type: String,
      default: ""
    },
    passwordResetExpiresAt: {
      type: Date,
      default: null
    },
    bookmarks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BusinessIdea"
      }
    ]
  },
  { timestamps: true }
);

userSchema.pre("save", async function onSave(next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
