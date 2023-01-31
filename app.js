const express = require("express");
const app = express();

const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xssClean = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors");
const bodyParser = require("body-parser");

const jobs = require("./routes/jobs");
const auth = require("./routes/auth");
const user = require("./routes/user");

const connectDatabase = require("./config/database");
const errorMiddleware = require("./middlewares/errors");
const ErrorHandler = require("./utils/errorHandler");

dotenv.config({ path: "./config/config.env" });

process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log("Shutting down the server due to uncaught exception");
  process.exit(1);
});

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
});

connectDatabase();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'))

app.use(helmet());

app.use(express.json());

app.use(cookieParser());

app.use(fileUpload());

app.use(mongoSanitize());

app.use(xssClean());

app.use(hpp());

app.use(cors());

app.use(limiter);

app.use("/api/v1", jobs);
app.use("/api/v1", auth);
app.use("/api/v1", user);

app.all("*", (req, res, next) => {
  next(new ErrorHandler(`${req.originalUrl} route not found`, 404));
});

app.use(errorMiddleware);

const PORT = process.env.PORT;

const server = app.listen(PORT, () => {
  console.log(
    `Server is running on port ${PORT} in ${process.env.NODE_ENV} mode`
  );
});

process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  console.log("Shuting down the server due to unhandled promise rejection");
  server.close(() => {
    process.exit(1);
  });
});
