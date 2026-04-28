const Skill = require("../models/Skill");
const Interest = require("../models/Interest");
const { defaultInterests, defaultSkills } = require("../config/defaultCatalog");

const withVirtualId = (items) =>
  items.map((item) => ({
    _id: `default-${item.name.toLowerCase().replace(/\s+/g, "-")}`,
    ...item
  }));

const getSkills = async (req, res, next) => {
  try {
    res.set("Cache-Control", "public, max-age=3600");
    const skills = await Skill.find().sort({ name: 1 }).lean();
    if (!skills.length) {
      return res.json({ skills: withVirtualId(defaultSkills) });
    }

    return res.json({ skills });
  } catch (error) {
    return next(error);
  }
};

const getInterests = async (req, res, next) => {
  try {
    res.set("Cache-Control", "public, max-age=3600");
    const interests = await Interest.find().sort({ name: 1 }).lean();
    if (!interests.length) {
      return res.json({ interests: withVirtualId(defaultInterests) });
    }

    return res.json({ interests });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getInterests,
  getSkills
};
