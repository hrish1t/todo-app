const mongoose = require('mongoose')

const todoSchema = new mongoose.Schema({
  desc: {
    type: String,
    required: true
  },
  comp: {
    type: Boolean,
    default: false
  },
  userId: {
    type: String,
    required: true
  }
})

module.exports = mongoose.model('Todo', todoSchema)