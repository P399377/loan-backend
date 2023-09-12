import User from "../models/userModel.js";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Register a new user
export const registerUser = async (req, res) => {
  // Extract fields from the request body
  const { name, email, password, role } = req.body;

  // Check if any of the required fields is missing
  if (!name || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "Please provide name, email, password, and role.",
    });
  }

  try {
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password should have at least 8 characters.",
      });
    }

    //Verify if the email is already in use.
    const alreadyUser = await User.findOne({ email });
    if (alreadyUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists.",
      });
    }

    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user in the database
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    // Send the new user
    res.status(201).json({
      success: true,
      message: "Registration successful.",
      newUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// User login function
export const loginUser = async (req, res) => {
  // Extract required fields from the request body
  const { email, password } = req.body;

  try {
    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required fields",
      });
    }

    // Find the user in the database by email
    const loginUser = await User.findOne({ email }).select("+password");

    // If no user exists with this email, send an error
    if (!loginUser) {
      return res.status(400).json({
        success: false,
        message: "No user exists with this email",
      });
    }

    // Compare the provided password with the stored password
    const isMatched = await bcrypt.compare(password, loginUser.password);

    // If passwords don't match, send an error
    if (!isMatched) {
      return res.status(400).json({
        success: false,
        message: "Invalid Password",
      });
    }

    // Create a token for user authorization
    const token = jwt.sign(
      { user_id: loginUser._id },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "3d",
      }
    );

    // Send a successful login response with the token
    res.status(200).json({
      success: true,
      message: "Login Successful",
      token,
      role: loginUser.role,
    });
  } catch (err) {
    // Handle any errors that occur
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
