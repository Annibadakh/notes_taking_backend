const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { OAuth2Client } = require("google-auth-library");
const { sendOtp, sendLoginSuccessMail, sendSuccessMail } = require("../services/mailService");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

const generateToken = (user) => {
  return jwt.sign(
    { uuid: user.uuid, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const loginWithPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found!! Register first" });

    if (!user.isEmailVerified)
      return res.status(403).json({ message: "Email not verified" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // console.log("otp generated", otp);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    sendOtp(email, otp, user.username, "login to you account");

    return res.status(200).json({ message: "OTP sent to email. Please verify to complete login." });
  } catch (err) {
    console.error("error to send otp", err);
    return res.status(500).json({ message: "Error logging in", error: err.message });
  }
};

const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP are required" });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found!! Register first" });

    const now = new Date();
    if (!user.otp || !user.otpExpiry || now > user.otpExpiry) {
      return res.status(400).json({ message: "OTP expired. Please login again." });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    const token = generateToken(user);

    sendLoginSuccessMail(user.email, user.username);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: { uuid: user.uuid, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error("error verifying otp", err);
    return res.status(500).json({ message: "Error verifying login OTP", error: err.message });
  }
};


const oauthLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Google ID token is required" });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const googleId = payload.sub;

    if (!email || !googleId) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    let user = await User.findOne({ where: { email, googleId } });

    // if (!user) return res.status(404).json({ message: "User not found!! Register first" });
    if(!user){
      const username = payload.name || email.split("@")[0];
      user = await User.create({
        username,
        email,
        googleId,
        password: null,
        isEmailVerified: true,
      });
      await sendSuccessMail(user.email, user.username);
    }

    const jwtToken = generateToken(user);

    await sendLoginSuccessMail(user.email, user.username);

    return res.status(200).json({
      message: "OAuth login successful",
      token: jwtToken,
      user: { uuid: user.uuid, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error("error in oauth login", err);
    return res.status(500).json({ message: "Error logging in via OAuth", error: err.message });
  }
};



module.exports = { loginWithPassword, verifyLoginOtp, oauthLogin };
