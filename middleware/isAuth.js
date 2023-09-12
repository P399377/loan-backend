import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

// Middleware to verify and decode a JWT token
const verifyToken = async (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(400).json({
      success: false,
      message: "No authorization token is provided",
    });
  }

  try {
    const decodedToken = jwt.verify(
      token.split(" ")[1],
      process.env.JWT_SECRET_KEY
    );
    const user_id = decodedToken.user_id;
    req.user = await User.findById(user_id);
    return next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export default verifyToken;
