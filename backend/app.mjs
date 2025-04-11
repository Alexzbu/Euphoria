import express from 'express'
import connectDB from './db/connectDB.mjs'
import errorHandler from './middleware/errorHandler.mjs'
import middleware from './middleware/index.mjs'
import routes from './routes/index.mjs'
import { ENTRY_POINT } from './constants/routes.mjs'

const app = express()

connectDB()

middleware(app)

app.use(ENTRY_POINT, routes)

errorHandler(app)

export default app
