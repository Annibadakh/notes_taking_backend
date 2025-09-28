const express = require("express");
const {loginWithPassword, verifyLoginOtp, oauthLogin} = require("../controllers/loginController");

const router = express.Router();

router.post("/manual-login", loginWithPassword);
router.post("/verify-otp", verifyLoginOtp);
router.post("/oauth", oauthLogin);

module.exports = router;

