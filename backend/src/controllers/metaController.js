const Skill = require("../models/Skill");
const Interest = require("../models/Interest");

const getSkills = async (req, res, next) => {
  try {
    const skills = await Skill.find().sort({ name: 1 });
    return res.json({ skills });
  } catch (error) {
    return next(error);
  }
};

const getInterests = async (req, res, next) => {
  try {
    const interests = await Interest.find().sort({ name: 1 });
    return res.json({ interests });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getInterests,
  getSkills
};
