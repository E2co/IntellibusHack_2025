import Admin from '../models/Admin.js';
import { validationResult } from 'express-validator';

class AdminController {
  // GET /admin/admins - Get all admins
  async getAllAdmins(req, res) {
    try {
      const {
        activeOnly = 'true',
        orderBy = 'createdAt',
        order = 'desc'
      } = req.query;

      const options = {
        activeOnly: activeOnly === 'true',
        orderByField: orderBy,
        orderDirection: order
      };

      const admins = await Admin.findAll(options);

      res.status(200).json({
        success: true,
        data: admins,
        count: admins.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching admins',
        error: error.message
      });
    }
  }

  // GET /admin/admins/:id - Get admin by ID
  async getAdminById(req, res) {
    try {
      const { id } = req.params;
      
      const admin = await Admin.findById(id);
      
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      res.status(200).json({
        success: true,
        data: admin
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching admin',
        error: error.message
      });
    }
  }

  // POST /admin/admins - Create new admin
  async createAdmin(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, name, isActive, profile, permissions } = req.body;

      // Check if admin already exists
      const existingAdmin = await Admin.findByEmail(email);
      if (existingAdmin) {
        return res.status(409).json({
          success: false,
          message: 'Admin with this email already exists'
        });
      }

      const adminData = {
        email,
        name,
        isActive: isActive !== undefined ? isActive : true,
        profile: profile || {},
        permissions: permissions || ['read', 'write', 'delete', 'manage_users']
      };

      const admin = await Admin.create(adminData);

      res.status(201).json({
        success: true,
        message: 'Admin created successfully',
        data: admin
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating admin',
        error: error.message
      });
    }
  }

  // PUT /admin/admins/:id - Update admin
  async updateAdmin(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Don't allow updating ID, email, or role through this endpoint
      delete updates.id;
      delete updates.email;
      delete updates.role;

      const admin = await Admin.findById(id);
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      const updatedAdmin = await admin.update(updates);

      res.status(200).json({
        success: true,
        message: 'Admin updated successfully',
        data: updatedAdmin
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating admin',
        error: error.message
      });
    }
  }

  // PATCH /admin/admins/:id/permissions - Update admin permissions
  async updateAdminPermissions(req, res) {
    try {
      const { id } = req.params;
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          message: 'Permissions must be an array'
        });
      }

      const admin = await Admin.findById(id);
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      const updatedAdmin = await admin.updatePermissions(permissions);

      res.status(200).json({
        success: true,
        message: 'Admin permissions updated successfully',
        data: updatedAdmin
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating admin permissions',
        error: error.message
      });
    }
  }

  // PATCH /admin/admins/:id/status - Update admin status
  async updateAdminStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const admin = await Admin.findById(id);
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      const updatedAdmin = await admin.update({ isActive });

      res.status(200).json({
        success: true,
        message: `Admin ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: updatedAdmin
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating admin status',
        error: error.message
      });
    }
  }

  // DELETE /admin/admins/:id - Soft delete admin
  async softDeleteAdmin(req, res) {
    try {
      const { id } = req.params;

      const admin = await Admin.findById(id);
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      await admin.softDelete();

      res.status(200).json({
        success: true,
        message: 'Admin soft deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error soft deleting admin',
        error: error.message
      });
    }
  }

  // GET /admin/stats - Get admin dashboard statistics
  async getDashboardStats(req, res) {
    try {
      const allAdmins = await Admin.findAll({ activeOnly: false });
      const activeAdmins = allAdmins.filter(admin => admin.isActive);

      const stats = {
        totalAdmins: allAdmins.length,
        activeAdmins: activeAdmins.length,
        inactiveAdmins: allAdmins.length - activeAdmins.length
      };

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching dashboard stats',
        error: error.message
      });
    }
  }

  // POST /admin/admins/bulk - Create multiple admins
  async createBulkAdmins(req, res) {
    try {
      const { admins } = req.body;

      if (!Array.isArray(admins) || admins.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Admins array is required'
        });
      }

      const createdAdmins = await Admin.createMultiple(admins);

      res.status(201).json({
        success: true,
        message: `${createdAdmins.length} admins created successfully`,
        data: createdAdmins
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating bulk admins',
        error: error.message
      });
    }
  }

  // GET /admin/admins/:id/permissions - Check admin permissions
  async checkAdminPermissions(req, res) {
    try {
      const { id } = req.params;
      const { permission } = req.query;

      const admin = await Admin.findById(id);
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      if (permission) {
        const hasPermission = admin.hasPermission(permission);
        return res.status(200).json({
          success: true,
          data: { hasPermission }
        });
      }

      res.status(200).json({
        success: true,
        data: { permissions: admin.permissions }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error checking admin permissions',
        error: error.message
      });
    }
  }
}

export default new AdminController();