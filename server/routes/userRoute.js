import express from 'express';
import authUser from '../middlewears/authUser.js';
import AuthController from '../controllers/userController.js';

const router = express.Router();

// Auth endpoints
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/me', authUser, AuthController.me);
router.post('/logout', AuthController.logout);

export { router };
export default router;