const Job = require("../models/jobs");

const geoCoder = require("../utils/geocoder");
const path = require("path");
const fs = require("fs");

const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const APIFilters = require("../utils/apiFilters");

exports.getJobs = catchAsyncErrors(async (req, res, next) => {
  const apiFilters = new APIFilters(Job.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .searchByQuery()
    .pagination();

  const jobs = await apiFilters.query;

  res.status(200).json({
    success: true,
    results: jobs.length,
    data: jobs,
  });
});

exports.updateJob = catchAsyncErrors(async (req, res, next) => {
  let job = await Job.findById(req.params.id);

  if (!job) {
    return next(new ErrorHandler("Job not found", 404));
  }

  if (job.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorHandler(`user(${req.user.id}) is not allowed to update this job`)
    );
  }

  job = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "job is updated",
    data: job,
  });
});

exports.getJobId = catchAsyncErrors(async (req, res, next) => {
  const job = await Job.findById(req.params.id);

  if (!job || job.length === 0) {
    return next(new ErrorHandler("Job not found", 404));
  }

  res.status(200).json({
    success: true,
    data: job,
  });
});

exports.getJobIdAndSlug = catchAsyncErrors(async (req, res, next) => {
  const job = await Job.find({
    $and: [{ _id: req.params.id }, { slug: req.params.slug }],
  });

  if (!job || job.length === 0) {
    return next(new ErrorHandler("Job not found", 404));
  }

  res.status(200).json({
    success: true,
    data: job,
  });
});

exports.newJob = catchAsyncErrors(async (req, res, next) => {
  req.body.user = req.user.id;

  const job = await Job.create(req.body);

  res.status(200).json({
    success: true,
    message: "job created",
    data: job,
  });
});

exports.deleteJob = catchAsyncErrors(async (req, res, next) => {
  let job = await Job.findById(req.params.id).select("+applicantsApplied");

  if (!job) {
    return next(new ErrorHandler("Job not found", 404));
  }

  if (job.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorHandler(`user(${req.user.id}) is not allowed to update this job`)
    );
  }

  for (let i = 0; i < job.applicantsApplied.length; i++) {
    let filepath =
      `${__dirname}/public/uploads/${job.applicantsApplied[i].resume}`.replace(
        "\\controllers",
        ""
      );

    fs.unlink(filepath, (err) => {
      if (err) return console.log(err);
    });
  }

  job = await Job.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "job is deleted",
    data: job,
  });
});

exports.getJobsInRadius = catchAsyncErrors(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  const loc = await geoCoder.geocode(zipcode);
  const latitude = loc[0].latitude;
  const longitude = loc[0].longitude;

  const radius = distance / 3963;

  const jobs = await Job.find({
    location: {
      $geoWithin: { $centerSphere: [[longitude, latitude], radius] },
    },
  });
  res.status(200).json({
    success: true,
    results: jobs.length,
    data: jobs,
  });
});

exports.jobStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await Job.aggregate([
    {
      $match: { $text: { $search: '"' + req.params.topic + '"' } },
    },
    {
      $group: {
        _id: { $toUpper: "$experience" },
        totalJobs: { $sum: 1 },
        avgPosition: { $avg: "$positions" },
        avgSalary: { $avg: "$salary" },
        minSalary: { $min: "$salary" },
        maxSalary: { $max: "$salary" },
      },
    },
  ]);

  if (stats.length === 0) {
    return next(
      new ErrorHandler(`no stats found for - ${req.params.topic}`, 200)
    );
  }

  res.status(200).json({
    success: true,
    data: stats,
  });
});

exports.applyJob = catchAsyncErrors(async (req, res, next) => {
  let job = await Job.findById(req.params.id).select("+applicantsApplied");

  if (!job) {
    return next(new ErrorHandler("job not found", 404));
  }

  if (job.lastDate < new Date(Date.now())) {
    return next(
      new ErrorHandler(
        "you can not apply to this job, date to apply is over",
        400
      )
    );
  }

  for (let i = 0; i < job.applicantsApplied.length; i++) {
    if (job.applicantsApplied[i].id === req.user.id) {
      return next(
        new ErrorHandler("you have already applied for this job", 400)
      );
    }
  }

  if (!req.files) {
    return next(new ErrorHandler("please upload file"));
  }

  const file = req.files.file;

  const supportedFiles = /.docx|.pdf/;

  if (!supportedFiles.test(path.extname(file.name))) {
    return next(new ErrorHandler("please upload document file", 400));
  }

  if (file.size > process.env.MAX_FILE_SIZE) {
    return next(
      new ErrorHandler("please upload file that is less than 2mb", 400)
    );
  }

  file.name = `${req.user.name.replace(" ", "_")}_${job._id}${
    path.parse(file.name).ext
  }`;

  file.mv(`${process.env.UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.log(err);
      return next(new ErrorHandler("resume upload failed", 500));
    }

    await Job.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          applicantsApplied: {
            id: req.user.id,
            resume: file.name,
          },
        },
      },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );
    res.status(200).json({
      success: true,
      message: "applied to job successfully",
      data: file.name,
    });
  });
});
