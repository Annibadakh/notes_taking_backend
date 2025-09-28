const express = require("express");
const {registerUser, oauthRegister, verifyOtp} = require("../controllers/userController");

const router = express.Router();

router.post("/register", registerUser);
router.post("/oauth", oauthRegister);
router.post("/verify-otp", verifyOtp);

module.exports = router;