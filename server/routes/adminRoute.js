import express from 'express';
import AdminController from '../controllers/adminController.js';
import { body } from 'express-validator';

const router = express.Router();

// Validation rules
const userValidation = [
  body('email').isEmail().normalizeEmail(),
  body('name').notEmpty().trim(),
  body('role').optional().isIn(['user', 'admin', 'moderator']),
  body('isActive').optional().isBoolean()
];

// User management routes
router.get('/users', AdminController.getAllUsers);
router.get('/users/:id', AdminController.getUserById);
router.post('/users', userValidation, AdminController.createUser);
router.put('/users/:id', AdminController.updateUser);
router.patch('/users/:id/status', AdminController.updateUserStatus);
router.patch('/users/:id/role', AdminController.updateUserRole);
router.delete('/users/:id', AdminController.softDeleteUser);
router.delete('/users/:id/hard', AdminController.hardDeleteUser);

// Bulk operations
router.post('/users/bulk', AdminController.createBulkUsers);

// Search and analytics
router.get('/search', AdminController.searchUsers);
router.get('/stats', AdminController.getDashboardStats);

export default router;