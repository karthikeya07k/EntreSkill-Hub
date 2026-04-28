const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { getCorsOptions } = require("./config/env");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const ideaRoutes = require("./routes/ideaRoutes");
const roadmapRoutes = require("./routes/roadmapRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const mentorRoutes = require("./routes/mentorRoutes");
const adminRoutes = require("./routes/adminRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const metaRoutes = require("./routes/metaRoutes");
const courseRoutes = require("./routes/courseRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const { cors: corsOptions } = getCorsOptions();

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "500kb" }));

app.get("/api/health", (req, res) => {
  res.json({
    message: "EntreSkill Hub API is healthy.",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ideas", ideaRoutes);
app.use("/api/roadmaps", roadmapRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/mentors", mentorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/meta", metaRoutes);
app.use("/api/courses", courseRoutes);

app.use(errorHandler);

module.exports = app;
