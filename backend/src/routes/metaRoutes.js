const express = require("express");
const { getInterests, getSkills } = require("../controllers/metaController");

const router = express.Router();

router.get("/skills", getSkills);
router.get("/interests", getInterests);

module.exports = router;
