import express from 'express';
import UserController from '../controllers/userController.js';
import { body } from 'express-validator';

const router = express.Router();

// Validation rules
const userValidation = [
  body('email').isEmail().normalizeEmail(),
  body('name').notEmpty().trim().isLength({ min: 2 }),
  body('role').optional().isIn(['user', 'admin', 'moderator']),
  body('isActive').optional().isBoolean()
];

// User management routes
router.get('/', UserController.getAllUsers);
router.get('/stats/count', UserController.getUserStats);
router.get('/search/:query', UserController.searchUsers);
router.get('/email/:email', UserController.getUserByEmail);
router.get('/:id', UserController.getUserById);
router.post('/', userValidation, UserController.createUser);
router.post('/bulk', UserController.createBulkUsers);
router.put('/:id', UserController.updateUser);
router.patch('/:id/profile', UserController.updateUserProfile);
router.patch('/:id/preferences', UserController.updateUserPreferences);
router.patch('/:id/status', UserController.updateUserStatus);
router.patch('/:id/promote', UserController.promoteUserToAdmin);
router.patch('/:id/last-login', UserController.updateLastLogin);
router.delete('/:id', UserController.softDeleteUser);
router.delete('/:id/hard', UserController.hardDeleteUser);

export default router;