const express = require("express");
const router = express.Router();

const {
  getUserProfile,
  updatePassword,
  updateUser,
  deleteUser,
  getAppliedJobs,
  getPublishedJobs,
  getUsers,
  deleteUserAdmin,
} = require("../controllers/userController");

const { isAuthenticatedUser, authorizedRoles } = require("../middlewares/auth");

router.use(isAuthenticatedUser);

router.route("/me").get(getUserProfile);

router.route("/jobs/applied").get(authorizedRoles("user"), getAppliedJobs);

router
  .route("/jobs/published")
  .get(authorizedRoles("employeer", "admin"), getPublishedJobs);

router.route("/password/update").put(updatePassword);

router.route("/me/update").put(updateUser);
router.route("/me/delete").delete(deleteUser);

router.route("/users").get(authorizedRoles("admin"), getUsers);

router.route("/user/:id").delete(authorizedRoles("admin"), deleteUserAdmin);

module.exports = router;
