const express = require("express");
const {
  createResource,
  createResourceValidation,
  getApprovedResources,
  getMyResources,
  getPendingResources,
  updateResourceStatus,
  updateResourceStatusValidation
} = require("../controllers/resourceController");
const { protect } = require("../middleware/auth");
const authorizeRoles = require("../middleware/roles");
const validate = require("../middleware/validate");

const router = express.Router();

router.get("/", getApprovedResources);
router.get("/me", protect, authorizeRoles("mentor", "admin"), getMyResources);
router.get("/pending/list", protect, authorizeRoles("admin"), getPendingResources);
router.post("/", protect, authorizeRoles("mentor", "admin"), createResourceValidation, validate, createResource);
router.patch(
  "/:id/status",
  protect,
  authorizeRoles("admin"),
  updateResourceStatusValidation,
  validate,
  updateResourceStatus
);

module.exports = router;
