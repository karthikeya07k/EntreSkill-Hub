const { body } = require("express-validator");
const BusinessIdea = require("../models/BusinessIdea");
const Roadmap = require("../models/Roadmap");
const { buildRecommendations } = require("../services/recommendationService");

const createIdeaValidation = [
  body("title").trim().notEmpty().withMessage("Title is required."),
  body("description").trim().notEmpty().withMessage("Description is required."),
  body("category").trim().notEmpty().withMessage("Category is required.")
];

const getIdeas = async (req, res, next) => {
  try {
    const { category, search, active = "true" } = req.query;
    const query = {};

    if (category) {
      query.category = category;
    }

    if (active !== "all") {
      query.active = active === "true";
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } }
      ];
    }

    const ideas = await BusinessIdea.find(query).sort({ createdAt: -1 });
    return res.json({ ideas });
  } catch (error) {
    return next(error);
  }
};

const getIdeaById = async (req, res, next) => {
  try {
    const [idea, roadmap] = await Promise.all([
      BusinessIdea.findById(req.params.id),
      Roadmap.findOne({ businessIdea: req.params.id })
    ]);

    if (!idea) {
      return res.status(404).json({ message: "Business idea not found." });
    }

    return res.json({ idea, roadmap });
  } catch (error) {
    return next(error);
  }
};

const getRecommendedIdeas = async (req, res, next) => {
  try {
    const ideas = await BusinessIdea.find({ active: true });
    const recommendations = buildRecommendations(ideas, req.user.skills, req.user.interests);

    return res.json({
      recommendations: recommendations.slice(0, 12)
    });
  } catch (error) {
    return next(error);
  }
};

const createIdea = async (req, res, next) => {
  try {
    const idea = await BusinessIdea.create(req.body);
    return res.status(201).json({ message: "Business idea created.", idea });
  } catch (error) {
    return next(error);
  }
};

const updateIdea = async (req, res, next) => {
  try {
    const idea = await BusinessIdea.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!idea) {
      return res.status(404).json({ message: "Business idea not found." });
    }

    return res.json({ message: "Business idea updated.", idea });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createIdea,
  createIdeaValidation,
  getIdeaById,
  getIdeas,
  getRecommendedIdeas,
  updateIdea
};
