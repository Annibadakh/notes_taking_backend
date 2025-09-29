const express = require("express");
const {registerUser, oauthRegister, verifyOtp, resendOtp} = require("../controllers/userController");

const router = express.Router();

router.post("/register", registerUser);
router.post("/oauth", oauthRegister);
router.post("/verify-otp", verifyOtp);
router.post('/resend-otp', resendOtp);

module.exports = router;