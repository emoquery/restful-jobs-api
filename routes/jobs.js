const express = require("express");
const router = express.Router();

const {
  getJobs,
  newJob,
  updateJob,
  deleteJob,
  jobStats,
  getJobId,
  getJobIdAndSlug,
  getJobsInRadius,
  applyJob,
} = require("../controllers/jobsController");

const { isAuthenticatedUser } = require("../middlewares/auth");
const { authorizedRoles } = require("../middlewares/auth");

router.route("/jobs").get(getJobs);

router.route("/jobs/:zipcode/:distance").get(getJobsInRadius);

router.route("/job/:id").get(getJobId);

router
  .route("/job/:id/apply")
  .put(isAuthenticatedUser, authorizedRoles("user"), applyJob);

router.route("/job/:id/:slug").get(getJobIdAndSlug);

router.route("/stats/:topic").get(jobStats);

router
  .route("/job/:id")
  .put(isAuthenticatedUser, authorizedRoles("employeer", "admin"), updateJob)
  .delete(
    isAuthenticatedUser,
    authorizedRoles("employeer", "admin"),
    deleteJob
  );

router
  .route("/job/new")
  .post(isAuthenticatedUser, authorizedRoles("employeer", "admin"), newJob);

module.exports = router;
