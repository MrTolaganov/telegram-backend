const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const otpModel = require("../models/otp.model");
const BaseError = require("../errors/base.error");

class MailService {
  constructor() {
    dotenv.config();
    this.transporter = nodemailer.createTransport({
      port: process.env.SMTP_PORT,
      host: process.env.SMTP_HOST,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendOtp(email) {
    const otp = Math.floor(Math.random() * (1000000 - 100000) + 100000);
    const hashedOtp = await bcrypt.hash(otp.toString(), 10);
    await otpModel.create({
      email,
      otp: hashedOtp,
      expiredAt: Date.now() + 1000 * 60 * 5,
    });

    await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: `OTP for verification ${new Date().toLocaleString()}`,
      html: `<div>
                <h4>Your verification code is below</h4>
                <h1>${otp}</h1>
            </div>`,
    });
  }

  async verifyOtp(email, otp) {
    const otpData = await otpModel.find({ email });
    if (!otpData) throw BaseError.BadRequest("Verification data not found");

    const currentOtp = otpData[otpData.length - 1];

    if (!currentOtp)
      throw BaseError.BadRequest("Current verification code not found");

    if (currentOtp.expiredAt < new Date())
      throw BaseError.BadRequest("Your verification code is expired");

    const isValid = await bcrypt.compare(otp.toString(), currentOtp.otp);
    if (!isValid)
      throw BaseError.BadRequest("Incorrect verification code entered");

    await otpModel.deleteMany({ email });
    return true;
  }
}

module.exports = new MailService();
