import { Router } from 'express'
import { listServices, adminCreateService, adminUpdateService, seedServices } from '../controllers/serviceController.js'
import authUser from '../middlewears/authUser.js'
import authAdmin from '../middlewears/authAdmin.js'

const router = Router()

// Public
router.get('/', listServices)

// Admin-only (future use)
router.post('/', authUser, authAdmin, adminCreateService)
router.patch('/:id', authUser, authAdmin, adminUpdateService)

// Seed endpoint (dev/admin convenience)
router.post('/seed', authUser, authAdmin, seedServices)

export { router }
export default router