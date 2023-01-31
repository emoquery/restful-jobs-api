const mongoose = require("mongoose");
const validator = require("validator");
const slugify = require("slugify");
const geoCoder = require("../utils/geocoder");

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "please enter job title"],
    trim: true,
    maxlength: [100, "job title can not exceed 100 characters"],
  },
  slug: String,
  description: {
    type: String,
    required: [true, "please enter job description"],
    maxlength: 1000,
  },
  email: {
    type: String,
    validate: [validator.isEmail, "please add a valid email"],
  },
  address: {
    type: String,
    required: [true, "please add an address"],
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      type: [Number],
      index: "2dsphere",
    },
    formattedAddress: String,
    city: String,
    zipcode: String,
    country: String,
  },
  company: {
    type: String,
    required: [true, "please add company name"],
  },
  industry: {
    type: [String],
    required: [true, "Please enter industry for this job"],
    enum: {
      values: [
        "business",
        "information technology",
        "banking",
        "education/training",
        "telecommunication",
        "others",
      ],
      message: "please serrect correct options for industry",
    },
  },
  jobType: {
    type: String,
    required: [true, "Please enter job type"],
    enum: {
      values: ["permanent", "temporary", "internship"],
      message: "please select correct options for job type",
    },
  },
  minEducation: {
    type: String,
    required: [true, "Please enter minimum education for this job"],
    enum: {
      values: ["bachelors", "masters", "phd"],
      message: "please select correct options for education",
    },
  },
  positions: {
    type: Number,
    default: 1,
  },
  experience: {
    type: String,
    required: [true, "Please enter experience required for this job"],
    enum: {
      values: ["no experience", "1-2 years", "2-5 years", "5 years+"],
      message: "please select correct options for experience",
    },
  },
  salary: {
    type: Number,
    required: true,
  },
  postingDate: {
    type: Date,
    default: Date.now,
  },
  lastDate: {
    type: Date,
    default: new Date().setDate(new Date().getDate() + 7),
  },
  applicantsApplied: {
    type: [Object],
    select: false,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref:'User',
    required:true
  },
});

jobSchema.pre("save", function (next) {
  this.slug = slugify(this.title, { lower: true });

  next();
});

jobSchema.pre("save", async function (next) {
  const loc = await geoCoder.geocode(this.address);

  this.location = {
    type: "Point",
    coordinates: [loc[0].longitude, loc[0].latitude],
    formattedAddress: loc[0].formattedAddress,
    city: loc[0].city,
    zipcode: loc[0].zipcode,
    country: loc[0].countryCode,
  };
});

module.exports = mongoose.model("Job", jobSchema);
