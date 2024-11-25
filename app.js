const express = require('express')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const router = require('./routes/route.js')
const errorMiddleware = require('./middlewares/error.middleware.js')

const app = express()

dotenv.config()

app.use(express.json())
app.use(cors({ origin: process.env.BASE_CLIENT_URL, methods: ['GET', 'POST', 'PUT', 'DELETE'] }))
app.use(cookieParser())

app.use('/api', router)

app.use(errorMiddleware)

const PORT = process.env.PORT || 5000

const bootstrap = () => {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      app.listen(PORT, () => {
        console.log('MongoDB connected successfully')
        console.log(`Listening on: http://localhost:${PORT}`)
      })
    })
    .catch(error => console.log(error))
}

bootstrap()
