const bcrypt = require("bcryptjs");
const { User } = require("../models");
const { OAuth2Client } = require("google-auth-library");
const {sendOtp, sendSuccessMail} = require('../services/mailService');


const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);


const registerUser = async (req, res) => {
  try {
    const { username, email, password, dob } = req.body;
    // console.log(dob);
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("6 digit otp", otp);

    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    console.log("otp expiry 10 min", otpExpiry);

    const newUser = await User.create({
      username,
      email,
      dob: dob || null,
      password: hashedPassword,
      otp,
      otpExpiry,
      isEmailVerified: false,
    });
    // console.log(newUser);

    sendOtp(email, otp, username, "verify your email address");

    return res.status(201).json({
      message: "User registered. OTP sent to email.",
      user: { uuid: newUser.uuid, email: newUser.email },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error registering user", error: err.message });
  }
};


const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    const now = new Date();
    if (!user.otp || !user.otpExpiry || now > user.otpExpiry) {
      return res.status(400).json({ message: "OTP expired. Please request a new one." });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.isEmailVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    await sendSuccessMail(user.email, user.username);

    return res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Error verifying OTP", error: err.message });
  }
};

const oauthRegister = async (req, res) => {
  try {
    // console.log(req.body, "///////////////");

    if (!req.body.token) {
      return res.status(400).json({ message: "Google ID token is required" });
    }

    const ticket = await client.verifyIdToken({
      idToken: req.body.token,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();

    // console.log(payload.email, payload.sub, payload.name, "////////////////////");
    const email = payload.email;
    const googleId = payload.sub;
    const username = payload.name || email.split("@")[0];

    if (!email || !googleId) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    let user = await User.findOne({ where: { email } });

    if (user) {
      return res.status(200).json({
        message: "OAuth user already exists",
        user: {
          uuid: user.uuid,
          username: user.username,
          email: user.email,
        },
      });
    }

    user = await User.create({
      username,
      email,
      googleId,
      password: null,
      isEmailVerified: true,
    });

    sendSuccessMail(user.email, user.username);

    return res.status(201).json({
      message: "OAuth user registered successfully",
      user: {
        uuid: user.uuid,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error with OAuth register", error: err.message });
  }
};


module.exports = { registerUser, oauthRegister, verifyOtp };
