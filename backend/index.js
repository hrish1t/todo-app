const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()
const { OAuth2Client } = require('google-auth-library')
const jwt = require('jsonwebtoken')
const Todo = require('./models/Todo')
const authMiddleware = require('./middleware/auth')

const app = express()
const port = process.env.PORT || 3000
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

app.use(express.json())
app.use(cors())

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err))

app.get('/auth/config', (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.JWT_SECRET) {
    return res.status(500).json({ msg: 'Server auth is not configured' })
  }
  res.json({ clientId: process.env.GOOGLE_CLIENT_ID })
})

app.post('/auth/google', async (req, res) => {
  const { credential } = req.body
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    })
    const payload = ticket.getPayload()
    const userId = payload.sub
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ token })
  } catch (err) {
    res.status(401).json({ msg: 'Invalid Google credential' })
  }
})

app.get('/', (req, res) => {
  res.json({ msg: 'todo list server running' })
})

app.get('/todos', authMiddleware, async (req, res) => {
  const todos = await Todo.find({ userId: req.userId })
  res.json(todos)
})

app.get('/todo/:id', authMiddleware, async (req, res) => {
  const todo = await Todo.findOne({ _id: req.params.id, userId: req.userId })
  if (todo) {
    res.json({ msg: 'task found', data: todo })
  } else {
    res.json({ msg: 'task not found' })
  }
})

app.post('/todo', authMiddleware, async (req, res) => {
  const todo = await Todo.create({
    desc: req.body.desc,
    comp: req.body.comp,
    userId: req.userId
  })
  res.json({ msg: 'task added', data: todo })
})

app.put('/todo/:id', authMiddleware, async (req, res) => {
  const todo = await Todo.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { desc: req.body.desc, comp: req.body.comp },
    { new: true }
  )
  if (todo) {
    res.json({ msg: 'todo edited', data: todo })
  } else {
    res.json({ msg: 'todo not found' })
  }
})

app.delete('/todo/:id', authMiddleware, async (req, res) => {
  const todo = await Todo.findOneAndDelete({ _id: req.params.id, userId: req.userId })
  if (todo) {
    res.json({ msg: 'todo deleted', data: todo })
  } else {
    res.json({ msg: 'todo not found' })
  }
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})