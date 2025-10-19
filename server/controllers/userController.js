import User from '../models/User.js';
import { validationResult } from 'express-validator';

class UserController {
  // GET /users - Get all users (with pagination and filters)
  async getAllUsers(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        activeOnly = 'true',
        search = '',
        role = '',
        orderBy = 'createdAt',
        order = 'desc'
      } = req.query;

      // Build options for User.findAll
      const options = {
        activeOnly: activeOnly === 'true',
        orderByField: orderBy,
        orderDirection: order,
        role: role || ''
      };

      let users = await User.findAll(options);

      // Apply search filter
      if (search) {
        users = users.filter(user => 
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase()) ||
          (user.profile.phone && user.profile.phone.includes(search))
        );
      }

      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedUsers = users.slice(startIndex, endIndex);

      res.status(200).json({
        success: true,
        data: paginatedUsers,
        pagination: {
          current: parseInt(page),
          limit: parseInt(limit),
          total: users.length,
          pages: Math.ceil(users.length / limit)
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching users',
        error: error.message
      });
    }
  }

  // GET /users/:id - Get user by ID
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      
      const user = await User.findById(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching user',
        error: error.message
      });
    }
  }

  // GET /users/email/:email - Get user by email
  async getUserByEmail(req, res) {
    try {
      const { email } = req.params;
      
      const user = await User.findByEmail(email);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching user',
        error: error.message
      });
    }
  }

  // POST /users - Create new user
  async createUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, name, role, isActive, profile, preferences } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      const userData = {
        email,
        name,
        role: role || 'user',
        isActive: isActive !== undefined ? isActive : true,
        profile: profile || {},
        preferences: preferences || {}
      };

      const user = await User.create(userData);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating user',
        error: error.message
      });
    }
  }

  // PUT /users/:id - Update user
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Don't allow updating ID or email through this endpoint
      delete updates.id;
      delete updates.email;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const updatedUser = await user.update(updates);

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating user',
        error: error.message
      });
    }
  }

  // PATCH /users/:id/profile - Update user profile
  async updateUserProfile(req, res) {
    try {
      const { id } = req.params;
      const profileData = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const updatedUser = await user.updateProfile(profileData);

      res.status(200).json({
        success: true,
        message: 'User profile updated successfully',
        data: updatedUser
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating user profile',
        error: error.message
      });
    }
  }

  // PATCH /users/:id/preferences - Update user preferences
  async updateUserPreferences(req, res) {
    try {
      const { id } = req.params;
      const preferencesData = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const updatedUser = await user.updatePreferences(preferencesData);

      res.status(200).json({
        success: true,
        message: 'User preferences updated successfully',
        data: updatedUser
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating user preferences',
        error: error.message
      });
    }
  }

  // PATCH /users/:id/status - Update user status
  async updateUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const updatedUser = await user.update({ isActive });

      res.status(200).json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: updatedUser
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating user status',
        error: error.message
      });
    }
  }

  // PATCH /users/:id/promote - Promote user to admin (admin only)
  async promoteUserToAdmin(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const updatedUser = await user.promoteToAdmin();

      res.status(200).json({
        success: true,
        message: 'User promoted to admin successfully',
        data: updatedUser
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error promoting user to admin',
        error: error.message
      });
    }
  }

  // PATCH /users/:id/last-login - Update last login
  async updateLastLogin(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await user.updateLastLogin();

      res.status(200).json({
        success: true,
        message: 'Last login updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating last login',
        error: error.message
      });
    }
  }

  // DELETE /users/:id - Soft delete user
  async softDeleteUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await user.softDelete();

      res.status(200).json({
        success: true,
        message: 'User soft deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error soft deleting user',
        error: error.message
      });
    }
  }

  // DELETE /users/:id/hard - Hard delete user
  async hardDeleteUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await user.delete();

      res.status(200).json({
        success: true,
        message: 'User permanently deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting user',
        error: error.message
      });
    }
  }

  // GET /users/stats/count - Get user count statistics
  async getUserStats(req, res) {
    try {
      const totalUsers = await User.getCount(false);
      const activeUsers = await User.getCount(true);
      const allUsers = await User.findAll({ activeOnly: false });

      // Group by role
      const usersByRole = allUsers.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});

      // Recent users (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentUsers = allUsers.filter(user => 
        new Date(user.createdAt) > oneWeekAgo
      );

      const stats = {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        byRole: usersByRole,
        recent: recentUsers.length
      };

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching user statistics',
        error: error.message
      });
    }
  }

  // POST /users/bulk - Create multiple users
  async createBulkUsers(req, res) {
    try {
      const { users } = req.body;

      if (!Array.isArray(users) || users.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Users array is required'
        });
      }

      const createdUsers = await User.createMultiple(users);

      res.status(201).json({
        success: true,
        message: `${createdUsers.length} users created successfully`,
        data: createdUsers
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating bulk users',
        error: error.message
      });
    }
  }

  // GET /users/search/:query - Search users
  async searchUsers(req, res) {
    try {
      const { query } = req.params;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const allUsers = await User.findAll({ activeOnly: false });
      
      const filteredUsers = allUsers.filter(user =>
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        (user.profile.phone && user.profile.phone.includes(query))
      );

      res.status(200).json({
        success: true,
        data: filteredUsers,
        count: filteredUsers.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error searching users',
        error: error.message
      });
    }
  }
}

export default new UserController();