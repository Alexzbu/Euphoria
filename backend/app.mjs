import express from 'express'
import connectDB from './db/connectDB.mjs'
import errorHandler from './middleware/errorHandler.mjs'
import middleware from './middleware/index.mjs'
import routes from './routes/index.mjs'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

connectDB()

middleware(app)

app.use('/api/', routes)

errorHandler(app)

export default app
