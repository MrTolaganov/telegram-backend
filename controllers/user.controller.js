const BaseError = require('../errors/base.error')
const messageModel = require('../models/message.model')
const userModel = require('../models/user.model')
const mailService = require('../services/mail.service')

class UserController {
  async getContacts(req, res, next) {
    try {
      const userId = req.user._id
      const contactsData = await userModel.findById(userId).populate('contacts')
      const allContacts = contactsData.contacts.map(contact => contact.toObject())

      for (const contact of allContacts) {
        const lastMessage = await messageModel
          .findOne({
            $or: [
              { sender: userId, receiver: contact._id },
              { sender: contact._id, receiver: userId },
            ],
          })
          .populate('sender')
          .populate('receiver')
          .sort({ createdAt: -1 })

        contact.lastMessage = lastMessage
      }

      res.status(200).json({ contacts: allContacts })
    } catch (error) {
      next(error)
    }
  }

  async getMessages(req, res, next) {
    try {
      const userId = req.user._id
      const { contactId } = req.params

      const messages = await messageModel
        .find({
          $or: [
            { sender: userId, receiver: contactId },
            { sender: contactId, receiver: userId },
          ],
        })
        .populate({ path: 'sender', select: 'email', model: userModel })
        .populate({ path: 'receiver', select: 'email', model: userModel })

      await messageModel.updateMany(
        { sender: contactId, receiver: userId, status: 'sent' },
        { status: 'read' }
      )

      res.status(200).json({ messages })
    } catch (error) {
      next(error)
    }
  }

  async createContact(req, res, next) {
    try {
      const userId = req.user._id
      const { email } = req.body

      const user = await userModel.findById(userId)
      const contact = await userModel.findOne({ email })

      if (!contact) throw BaseError.BadRequest('User with this email does not exist')
      if (user.email === contact.email)
        throw BaseError.BadRequest('You can not add yourself to contacts')

      const existedContact = await userModel.findOne({
        _id: user._id,
        contacts: contact._id,
      })
      if (existedContact) throw BaseError.BadRequest('Contact already exists')

      await userModel.findByIdAndUpdate(
        user._id,
        { $push: { contacts: contact._id } },
        { new: true }
      )

      const newContact = await userModel.findByIdAndUpdate(
        contact._id,
        { $push: { contacts: user._id } },
        { new: true }
      )

      return res.status(201).json({ contact: newContact })
    } catch (error) {
      next(error)
    }
  }

  async createMessage(req, res, next) {
    try {
      const userId = req.user._id
      const newMessage = await messageModel.create({ ...req.body, sender: userId })

      const currentMessage = await messageModel
        .findById(newMessage._id)
        .populate({ path: 'sender', select: 'email', model: userModel })
        .populate({ path: 'receiver', select: 'email', model: userModel })

      const sender = await userModel.findById(newMessage.sender)
      const receiver = await userModel.findById(newMessage.receiver)

      res.status(201).json({ message: currentMessage, sender, receiver })
    } catch (error) {
      next(error)
    }
  }

  async createReaction(req, res, next) {
    try {
      const { messageId, reaction } = req.body
      const updatedMessage = await messageModel.findByIdAndUpdate(
        messageId,
        { reaction },
        { new: true }
      )
      res.status(200).json({ message: updatedMessage })
    } catch (error) {
      next(error)
    }
  }

  async sendOtp(req, res, next) {
    try {
      const { email } = req.body
      const existedUser = await userModel.findOne({ email })
      if (existedUser) throw BaseError.BadRequest('User with this email already exists')
      await mailService.sendOtp(email)
      res.status(200).json({ email })
    } catch (error) {
      next(error)
    }
  }

  async readMessages(req, res, next) {
    try {
      const { messages } = req.body
      const allMessages = []

      for (const message of messages) {
        const updateMessage = await messageModel.findByIdAndUpdate(
          message._id,
          { status: 'read' },
          { new: true }
        )

        allMessages.push(updateMessage)
      }

      res.status(200).json({ messages: allMessages })
    } catch (error) {
      next(error)
    }
  }

  async updateProfile(req, res, next) {
    try {
      await userModel.findByIdAndUpdate(req.user._id, req.body)
      res.status(200).json({ message: 'Profile updated successully' })
    } catch (error) {
      next(error)
    }
  }

  async updateMessage(req, res, next) {
    try {
      const { messageId } = req.params
      const { text } = req.body

      const updatedMessage = await messageModel.findByIdAndUpdate(
        messageId,
        { text },
        { new: true }
      )

      res.status(200).json({ message: updatedMessage })
    } catch (error) {
      next(error)
    }
  }

  async updateEmail(req, res, next) {
    try {
      const { email, otp } = req.body
      const result = await mailService.verifyOtp(email, otp)
      if (result) {
        const userId = req.user._id
        const user = await userModel.findByIdAndUpdate(userId, { email }, { new: true })
        res.status(200).json({ user })
      }
    } catch (error) {
      next(error)
    }
  }

  async deleteMessage(req, res, next) {
    try {
      const { messageId } = req.params
      const deletedMessage = await messageModel.findByIdAndDelete(messageId)
      res.status(200).json({ message: deletedMessage })
    } catch (error) {
      next(error)
    }
  }

  async deleteUser(req, res, next) {
    try {
      const userId = req.user._id
      await userModel.findByIdAndDelete(userId)
      res.status(200).json({ message: 'User deleted successfully' })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new UserController()
