// Import required modules
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";

// Import routes
import userRoute from "./routes/userRoute.js";
import loanRoute from "./routes/loanRoute.js";

// Configuration for dotenv file
dotenv.config();

// Connecting to MongoDB
mongoose
  .connect(process.env.DB_URI, {
    dbName: "Customer-Loan",
  })
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((err) => {
    console.error(err);
  });

// Creating an Express server
const app = express();

// Enable CORS to allow requests from any domain
app.use(cors());

// Middleware to parse JSON and URL-encoded data in request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Define routes for the web app
app.use("/user", userRoute);
app.use("/loan", loanRoute);

// Import the bodyParser middleware
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));

// Error handling middleware to handle errors from routes
app.use((err, req, res, next) => {
  if (!err.statusCode) err.statusCode = 500;
  if (!err.message) err.message = "Internal Server Error";
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
});

// Start the server and listen on the specified port
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
