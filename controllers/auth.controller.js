const userModel = require('../models/user.model')
const mailService = require('../services/mail.service')

class AuthController {
  async login(req, res, next) {
    try {
      const { email } = req.body
      const existedUser = await userModel.findOne({ email })

      if (existedUser) {
        await mailService.sendOtp(existedUser.email)
        return res.status(200).json({ email: existedUser.email })
      }

      const newUser = await userModel.create({ email })
      await mailService.sendOtp(newUser.email)
      res.status(201).json({ email: newUser.email })
    } catch (error) {
      next(error)
    }
  }

  async verify(req, res, next) {
    try {
      const { email, otp } = req.body
      const result = await mailService.verifyOtp(email, otp)

      if (result) {
        const user = await userModel.findOneAndUpdate({ email }, { verified: true }, { new: true })
        res.status(200).json({ user })
      }
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new AuthController()
