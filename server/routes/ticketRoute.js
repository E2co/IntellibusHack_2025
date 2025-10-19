// server/routes/ticketRoute.js
import { Router } from 'express'
import { createTicket, getMyTicket, cancelMyTicket, getPublicTraffic, adminAdvanceQueue } from '../controllers/ticketController.js'
import authUser from '../middlewears/authUser.js'
import authAdmin from '../middlewears/authAdmin.js'

const router = Router()

// User endpoints
router.post('/', authUser, createTicket)
router.get('/me', authUser, getMyTicket)
router.patch('/me/cancel', authUser, cancelMyTicket)

// Public traffic endpoint
router.get('/public-traffic', getPublicTraffic)

// Admin endpoint
router.post('/:serviceId/advance', authUser, authAdmin, adminAdvanceQueue)

export { router }
export default router