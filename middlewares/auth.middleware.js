const jwt = require('jsonwebtoken')
const BaseError = require('../errors/base.error')
const userModel = require('../models/user.model')

module.exports = async function (req, res, next) {
  try {
    const authHead = req.headers.authorization
    if (!authHead) return next(BaseError.Unauthorized())

    const token = authHead.split(' ').at(1)
    if (!token) return next(BaseError.Unauthorized())

    const { userId } = jwt.verify(token, process.env.JWT_SECRET)
    if (!userId) return next(BaseError.Unauthorized())

    const user = await userModel.findById(userId)
    if (!user) return next(BaseError.Unauthorized())

    req.user = user
    next()
  } catch (error) {
    return next(BaseError.BadRequest('Auth middleware error'))
  }
}
