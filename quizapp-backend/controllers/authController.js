import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ username, email, password: hashedPassword });

    // Generate token for auto-login
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    
    // Create a safe user object (without password)
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      created_at: user.createdAt || new Date(),
    };

    res.status(201).json({ 
      message: "User registered successfully", 
      token,
      user: userData
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Something went wrong during registration", error: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Create a safe user object (without password)
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      created_at: user.createdAt || new Date(),
      updated_at: user.updatedAt
    };

    res.status(200).json({ 
      message: "Login successful", 
      token,
      user: userData
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Something went wrong during login", error: error.message });
  }
};
