import express from 'express';
import authUser from '../middlewears/authUser.js';
import { register, login, me, logout, adminLogin, adminRegister } from '../controllers/userController.js';

const router = express.Router();

// Regular user auth endpoints
router.post('/register', register);
router.post('/login', login);
router.get('/me', authUser, me);
router.post('/logout', logout);

// Admin auth endpoints
router.post('/admin/login', adminLogin);
router.post('/admin/register', adminRegister);

export { router };
export default router;