import jwt from "jsonwebtoken";
import axios from "axios";
import { client } from "../config/google.js";
import User from "../models/user.model.js";

const createToken = (user) => {
  const data = {
    _id: user._id,
    email: user.email,
    userName: user.userName,
    currentStation: user.currentStation,
  };
  return jwt.sign(data, "secret", { expiresIn: "7d" });
};

const createCookie = (token, res) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // use https in prod
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // works for localhost
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const googleAuth = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res
        .status(400)
        .json({ message: "Code is required", success: false });
    }
    const googleRes = await client.getToken({
      code,
      redirect_uri: "postmessage",
    });
    client.setCredentials(googleRes.tokens);
    const userRes = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${googleRes.tokens.access_token}`,
        },
      },
    );
    const { email, name } = userRes.data;
    let isUserExits = true;

    let user = await User.findOne({ email });
    if (!user) {
      isUserExits = false;
      user = await User.create({
        email,
        userName: name,
        avatar: userRes.data.picture,
      });
    }
    const token = createToken(user);
    createCookie(token, res);
    return res.status(200).json({
      success: true,
      message: "Login successfully",
      token,
      user,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Something went wrong", success: false });
  }
};

export const isAuth = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized", success: false });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    return res.status(200).json({
      success: true,
      user,
      message: "User authenticated successfully",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Something went wrong", success: false });
  }
};

export const logout = (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Something went wrong", success: false });
  }
};

export const updateCurrentStation = async (req, res) => {
  try {
    const userId = req.user._id;

    const { currentStation } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    if (!currentStation) {
      return res.status(400).json({
        message: "Current station is required",
        success: false,
      });
    }

    const userDetails = await User.findById(userId);

    userDetails.currentStation = currentStation;

    await userDetails.save();

    return res.status(201).json({
      message: "Successfully created",
      success: true,
      user: userDetails,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Something went wrong", success: false });
  }
};
