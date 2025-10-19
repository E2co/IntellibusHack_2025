import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import './configs/db.js' // initializes Firebase client SDK

import * as userRoutes from './routes/userRoute.js'
import * as serviceRoutes from './routes/serviceRoute.js'
import * as ticketRoutes from './routes/ticketRoute.js'
import { getPublicTraffic } from './controllers/ticketController.js'

// Middleware
const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true}))
app.use(cookieParser())
app.use(express.json())

// Health endpoint
app.get('/', (req, res) => res.send('it work'))
// API routes
// Resolve router exports whether default or named
const resolveRouter = (mod) => mod.default || mod.router || mod

app.use('/api/auth', resolveRouter(userRoutes))
app.use('/api/services', resolveRouter(serviceRoutes))
app.use('/api/tickets', resolveRouter(ticketRoutes))  
// Public traffic alias
app.get('/api/traffic', getPublicTraffic)

// Error handler
app.use((err, req, res, next) => {
  console.error('Error', err)
  const status = err.status || 500
  res.status(status).json({ error: err.message || 'Internal Server Error' })
})


app.listen(PORT, ()=>{
  console.log(`Server is running on http://localhost:${PORT}`)
  console.log(`CORS origin: ${CLIENT_ORIGIN}`)

});