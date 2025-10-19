// server/routes/ticketRoute.js
import { Router } from 'express'
import { createTicket, getMyTicket, cancelMyTicket, getPublicTraffic, adminAdvanceQueue, clearAllQueues } from '../controllers/ticketController.js'
import authUser from '../middlewears/authUser.js'
import authAdmin from '../middlewears/authAdmin.js'

const router = Router()

// User endpoints
router.post('/', authUser, createTicket)
router.get('/me', authUser, getMyTicket)
router.patch('/me/cancel', authUser, cancelMyTicket)

// Public traffic endpoint
router.get('/public-traffic', getPublicTraffic)

// Admin endpoints
router.post('/:serviceId/advance', authUser, authAdmin, adminAdvanceQueue)
router.post('/clear-all', clearAllQueues) // Temporary - for development only

export { router }
export default router