const { body } = require("express-validator");
const CourseTrack = require("../models/CourseTrack");
const CourseProgress = require("../models/CourseProgress");

const normalizeStringArray = (value) =>
  Array.isArray(value) ? [...new Set(value.map((item) => String(item).trim()).filter(Boolean))] : [];

const flattenLessonIds = (track) =>
  track.modules.flatMap((moduleItem) => moduleItem.lessons.map((lesson) => lesson.lessonId));

const createTrackValidation = [
  body("title").trim().isLength({ min: 4, max: 200 }).withMessage("Track title must be 4-200 characters."),
  body("slug")
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage("Slug must contain only lowercase letters, numbers, and hyphens."),
  body("category").trim().notEmpty().withMessage("Category is required."),
  body("level").optional().isIn(["Beginner", "Intermediate", "Advanced"]).withMessage("Invalid level."),
  body("description").trim().isLength({ min: 20, max: 3000 }).withMessage("Description must be 20-3000 chars."),
  body("estimatedHours").optional().isFloat({ min: 1, max: 300 }).withMessage("estimatedHours must be 1-300."),
  body("modules").isArray({ min: 1 }).withMessage("At least one module is required.")
];

const updateTrackValidation = [
  body("title").optional().trim().isLength({ min: 4, max: 200 }).withMessage("Track title must be 4-200 chars."),
  body("category").optional().trim().notEmpty().withMessage("Category cannot be empty."),
  body("level").optional().isIn(["Beginner", "Intermediate", "Advanced"]).withMessage("Invalid level."),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 20, max: 3000 })
    .withMessage("Description must be 20-3000 chars."),
  body("estimatedHours").optional().isFloat({ min: 1, max: 300 }).withMessage("estimatedHours must be 1-300."),
  body("modules").optional().isArray({ min: 1 }).withMessage("Modules must be a non-empty array.")
];

const updateTrackPublishValidation = [
  body("published").isBoolean().withMessage("published must be true or false.")
];

const updateCourseProgressValidation = [
  body("lessonId").trim().notEmpty().withMessage("lessonId is required."),
  body("completed").isBoolean().withMessage("completed must be true or false.")
];

const validateTrackStructure = (modules = []) => {
  const moduleIds = new Set();
  const lessonIds = new Set();

  for (const moduleItem of modules) {
    if (!moduleItem?.moduleId || moduleIds.has(moduleItem.moduleId)) {
      return "Each module must have a unique moduleId.";
    }
    moduleIds.add(moduleItem.moduleId);

    if (!Array.isArray(moduleItem.lessons) || !moduleItem.lessons.length) {
      return "Each module must include at least one lesson.";
    }

    for (const lesson of moduleItem.lessons) {
      if (!lesson?.lessonId || lessonIds.has(lesson.lessonId)) {
        return "Each lesson must have a unique lessonId.";
      }
      if (!lesson?.title || !lesson?.url) {
        return "Each lesson needs title and url.";
      }
      lessonIds.add(lesson.lessonId);
    }
  }

  return null;
};

const withProgressSummary = (track, progressDoc) => {
  const lessons = flattenLessonIds(track);
  const completed = new Set(progressDoc?.completedLessonIds || []);
  const completedLessons = lessons.filter((lessonId) => completed.has(lessonId)).length;
  const completionPercent = lessons.length ? Math.round((completedLessons / lessons.length) * 100) : 0;
  const nextLessonId = lessons.find((lessonId) => !completed.has(lessonId)) || "";

  return {
    ...track.toObject(),
    totalModules: track.modules.length,
    totalLessons: lessons.length,
    completedLessons,
    completionPercent,
    nextLessonId
  };
};

const getTracks = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role !== "admin") {
      query.published = true;
    } else if (req.query.published === "true" || req.query.published === "false") {
      query.published = req.query.published === "true";
    }

    const tracks = await CourseTrack.find(query).sort({ updatedAt: -1 });
    const progressDocs = await CourseProgress.find({ user: req.user._id }).lean();
    const progressMap = new Map(progressDocs.map((item) => [item.track.toString(), item]));

    const enriched = tracks.map((track) => withProgressSummary(track, progressMap.get(track._id.toString())));

    return res.json({ tracks: enriched });
  } catch (error) {
    return next(error);
  }
};

const getRecommendedTracks = async (req, res, next) => {
  try {
    const tracks = await CourseTrack.find({ published: true }).sort({ updatedAt: -1 });
    const userSkills = new Set(req.user.skills || []);
    const userInterests = new Set(req.user.interests || []);

    const scored = tracks
      .map((track) => {
        const skillMatches = track.linkedSkills.filter((item) => userSkills.has(item));
        const interestMatches = track.linkedInterests.filter((item) => userInterests.has(item));
        const score = skillMatches.length * 6 + interestMatches.length * 5 + (track.level === "Beginner" ? 2 : 0);

        return {
          ...track.toObject(),
          score,
          skillMatches,
          interestMatches
        };
      })
      .sort((a, b) => b.score - a.score);

    return res.json({ tracks: scored.slice(0, 8) });
  } catch (error) {
    return next(error);
  }
};

const getTrackById = async (req, res, next) => {
  try {
    const track = await CourseTrack.findById(req.params.trackId);

    if (!track || (!track.published && req.user.role !== "admin")) {
      return res.status(404).json({ message: "Track not found." });
    }

    const progress = await CourseProgress.findOne({ user: req.user._id, track: track._id });

    return res.json({
      track: withProgressSummary(track, progress),
      progress:
        progress || {
          completedLessonIds: [],
          completionPercent: 0,
          lastLessonId: ""
        }
    });
  } catch (error) {
    return next(error);
  }
};

const createTrack = async (req, res, next) => {
  try {
    const structureError = validateTrackStructure(req.body.modules || []);
    if (structureError) {
      return res.status(422).json({ message: structureError });
    }

    const track = await CourseTrack.create({
      title: req.body.title,
      slug: req.body.slug,
      category: req.body.category,
      level: req.body.level || "Beginner",
      estimatedHours: req.body.estimatedHours || 4,
      description: req.body.description,
      tags: normalizeStringArray(req.body.tags),
      linkedSkills: normalizeStringArray(req.body.linkedSkills),
      linkedInterests: normalizeStringArray(req.body.linkedInterests),
      modules: req.body.modules,
      published: req.body.published !== false,
      createdBy: req.user._id
    });

    return res.status(201).json({
      message: "Learning track created.",
      track
    });
  } catch (error) {
    return next(error);
  }
};

const updateTrack = async (req, res, next) => {
  try {
    const track = await CourseTrack.findById(req.params.trackId);
    if (!track) {
      return res.status(404).json({ message: "Track not found." });
    }

    if (req.body.modules) {
      const structureError = validateTrackStructure(req.body.modules);
      if (structureError) {
        return res.status(422).json({ message: structureError });
      }
    }

    const fields = [
      "title",
      "category",
      "level",
      "description",
      "estimatedHours",
      "modules",
      "published"
    ];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        track[field] = req.body[field];
      }
    });

    if (req.body.tags !== undefined) {
      track.tags = normalizeStringArray(req.body.tags);
    }
    if (req.body.linkedSkills !== undefined) {
      track.linkedSkills = normalizeStringArray(req.body.linkedSkills);
    }
    if (req.body.linkedInterests !== undefined) {
      track.linkedInterests = normalizeStringArray(req.body.linkedInterests);
    }

    track.updatedBy = req.user._id;
    await track.save();

    return res.json({
      message: "Track updated.",
      track
    });
  } catch (error) {
    return next(error);
  }
};

const updateTrackPublish = async (req, res, next) => {
  try {
    const track = await CourseTrack.findByIdAndUpdate(
      req.params.trackId,
      {
        published: req.body.published,
        updatedBy: req.user._id
      },
      { new: true }
    );

    if (!track) {
      return res.status(404).json({ message: "Track not found." });
    }

    return res.json({
      message: `Track ${track.published ? "published" : "unpublished"}.`,
      track
    });
  } catch (error) {
    return next(error);
  }
};

const updateCourseProgress = async (req, res, next) => {
  try {
    const track = await CourseTrack.findById(req.params.trackId);

    if (!track || !track.published) {
      return res.status(404).json({ message: "Track not found." });
    }

    const allLessonIds = flattenLessonIds(track);
    if (!allLessonIds.includes(req.body.lessonId)) {
      return res.status(400).json({ message: "Invalid lesson for this track." });
    }

    let progress = await CourseProgress.findOne({ user: req.user._id, track: track._id });
    if (!progress) {
      progress = await CourseProgress.create({
        user: req.user._id,
        track: track._id,
        completedLessonIds: []
      });
    }

    const set = new Set(progress.completedLessonIds || []);
    if (req.body.completed) {
      set.add(req.body.lessonId);
    } else {
      set.delete(req.body.lessonId);
    }

    progress.completedLessonIds = [...set];
    progress.lastLessonId = req.body.lessonId;
    progress.lastAccessedAt = new Date();
    progress.completionPercent = allLessonIds.length
      ? Math.round((progress.completedLessonIds.length / allLessonIds.length) * 100)
      : 0;
    progress.completedAt = progress.completionPercent >= 100 ? new Date() : null;
    await progress.save();

    return res.json({
      message: "Course progress updated.",
      progress
    });
  } catch (error) {
    return next(error);
  }
};

const getMyCourseProgress = async (req, res, next) => {
  try {
    const progress = await CourseProgress.find({ user: req.user._id })
      .populate("track", "title slug category level published")
      .sort({ updatedAt: -1 });

    return res.json({ progress });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createTrack,
  createTrackValidation,
  getMyCourseProgress,
  getRecommendedTracks,
  getTrackById,
  getTracks,
  updateCourseProgress,
  updateCourseProgressValidation,
  updateTrack,
  updateTrackPublish,
  updateTrackPublishValidation,
  updateTrackValidation
};
