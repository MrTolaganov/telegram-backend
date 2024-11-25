const { Schema, model } = require('mongoose')

const messageSchema = new Schema(
  {
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String },
    image: { type: String },
    reaction: { type: String },
  },
  { timestamps: true }
)

module.exports = model('Message', messageSchema)
