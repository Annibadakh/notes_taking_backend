const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,         
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});



const testEmailConnection = async (email, subject, html,  cc) => {
  try {
    const mailOptions = {
      from: `"HD Note Taking" <${process.env.EMAIL_USER}>`,
      to: email,
      cc: cc || undefined,
      subject,
      html,
      attachments: [
        {
          filename: 'HD Note Taking',
          path: './HDlogo2.png',
          cid: 'logo'
        },
      ],
      headers: {
        'X-Priority': '3',
        'X-Mailer': 'NodeMailer'
      }
    };
    const info = await transporter.sendMail(mailOptions);
    // console.log('Email sent successfully', info);
    return {
      success: true,
      message: 'Email sent successfully',
      info: info.response
    };
  } catch (error) {
    console.error('Failed to send email', error);
    return {
      success: false,
      message: 'Failed to send email',
      error: error.message
    };
  }
};

const sendOtp = async (email, otp, username, msg) => {
  const subject = "Verify Your Email for HD Note Taking";
  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center;">
      <img src="cid:logo" alt="HD Note Taking" style="width: 80px; height: auto; margin-bottom: 20px;">
    </div>
    <h2 style="color: #333; text-align: center;">Email Verification</h2>
    <p style="color: #555; font-size: 16px;">
      Hi <strong>${username}</strong>,<br><br>
      Use the OTP below to ${msg}. This OTP is valid for <strong>5 minutes</strong>.
    </p>
    <div style="text-align: center; margin: 20px 0;">
      <span style="display: inline-block; font-size: 24px; font-weight: bold; padding: 10px 20px; background-color: #4caf50; color: #fff; border-radius: 5px;">${otp}</span>
    </div>
    <p style="color: #999; font-size: 14px; text-align: center;">
      If you did not request this, please ignore this email.
    </p>
  </div>
  `;
  try {
    const mailOptions = {
      from: `"HD Note Taking" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
      attachments: [
        {
          filename: 'HD Note Taking',
          path: './HDlogo2.png',
          cid: 'logo'
        },
      ],
      headers: {
        'X-Priority': '3',
        'X-Mailer': 'NodeMailer'
      }
    };
    const info = await transporter.sendMail(mailOptions);
    // console.log('Otp sent successfully', info);
    return {
      success: true,
      message: 'Otp sent successfully',
      info: info.response
    };
  } catch (error) {
    console.error('Failed to send Otp', error);
    return {
      success: false,
      message: 'Failed to send Otp',
      error: error.message
    };
  }
};

const sendSuccessMail = async (email, username) => {
  const subject = "Registration Successful – Welcome to HD Note Taking";
  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center;">
      <img src="cid:logo" alt="HD Note Taking" style="width: 80px; height: auto; margin-bottom: 20px;">
    </div>
    <h2 style="color: #333; text-align: center;">Welcome, ${username}!</h2>
    <p style="color: #555; font-size: 16px;">
      You have successfully registered for <strong>HD Note Taking</strong>.<br><br>
      You can now start creating and managing your notes seamlessly.
    </p>
    <p style="text-align: center; margin: 20px 0;">
      <a href="https://your-app-url.com/login" style="display: inline-block; padding: 10px 20px; background-color: #4caf50; color: #fff; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
    </p>
    <p style="color: #999; font-size: 14px; text-align: center;">
      We're glad to have you on board!
    </p>
  </div>
  `;
  try {
    const mailOptions = {
      from: `"HD Note Taking" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
      attachments: [
        {
          filename: 'HD Note Taking',
          path: './HDlogo2.png',
          cid: 'logo'
        },
      ],
      headers: {
        'X-Priority': '3',
        'X-Mailer': 'NodeMailer'
      }
    };
    const info = await transporter.sendMail(mailOptions);
    // console.log('Registration email sent successfully', info);
    return {
      success: true,
      message: 'Registration email sent successfully',
      info: info.response
    };
  } catch (error) {
    console.error('Failed to send registration email', error);
    return {
      success: false,
      message: 'Failed to send registration email',
      error: error.message
    };
  }
};

const sendLoginSuccessMail = async (email, username) => {
  const subject = "Login Successful - HD Note Taking";
  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center;">
      <img src="cid:logo" alt="HD Note Taking" style="width: 80px; height: auto; margin-bottom: 20px;">
    </div>
    <h2 style="color: #333; text-align: center;">Hello, ${username}!</h2>
    <p style="color: #555; font-size: 16px;">
      You have successfully logged in to your <strong>HD Note Taking</strong> account.<br><br>
      If this was you, no further action is required. You can continue managing your notes with ease.
    </p>
    <p style="text-align: center; margin: 20px 0;">
      <a href="https://your-app-url.com/dashboard" style="display: inline-block; padding: 10px 20px; background-color: #4caf50; color: #fff; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
    </p>
    <p style="color: #999; font-size: 14px; text-align: center;">
      If this login was not initiated by you, please reset your password immediately for security.
    </p>
  </div>
  `;
  try {
    const mailOptions = {
      from: `"HD Note Taking" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
      attachments: [
        {
          filename: 'HD Note Taking',
          path: './HDlogo2.png',
          cid: 'logo'
        },
      ],
      headers: {
        'X-Priority': '3',
        'X-Mailer': 'NodeMailer'
      }
    };
    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      message: 'Login success email sent successfully',
      info: info.response
    };
  } catch (error) {
    console.error('Failed to send login success email', error);
    return {
      success: false,
      message: 'Failed to send login success email',
      error: error.message
    };
  }
};


module.exports = {testEmailConnection, sendOtp, sendSuccessMail, sendLoginSuccessMail};
