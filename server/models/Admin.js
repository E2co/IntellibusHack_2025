import { db } from '../config/firebase.js';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot 
} from 'firebase/firestore';

class Admin {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.name = data.name;
    this.role = data.role || 'admin'; // Changed default to 'admin'
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.lastLogin = data.lastLogin || null;
    this.profile = data.profile || {};
    this.permissions = data.permissions || ['read', 'write', 'delete', 'manage_users']; // Admin-specific permissions
  }

  // Static collection reference
  static get collection() {
    return collection(db, 'admins'); // Changed collection to 'admins'
  }

  // Document reference by ID
  static doc(id) {
    return doc(db, 'admins', id); // Changed collection to 'admins'
  }

  // Convert to plain object (for Firestore)
  toJSON() {
    return {
      email: this.email,
      name: this.name,
      role: this.role,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLogin: this.lastLogin,
      profile: this.profile,
      permissions: this.permissions
    };
  }

  // CREATE - Add new admin
  static async create(adminData) {
    try {
      // Ensure role is always 'admin' for admin users
      const admin = new Admin({
        ...adminData,
        role: 'admin' // Force role to be admin
      });
      
      const docRef = await addDoc(this.collection, admin.toJSON());
      
      // Return admin with ID
      return new Admin({
        id: docRef.id,
        ...admin.toJSON()
      });
    } catch (error) {
      throw new Error(`Error creating admin: ${error.message}`);
    }
  }

  // READ - Find admin by ID
  static async findById(id) {
    try {
      const docRef = this.doc(id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return new Admin({
          id: docSnap.id,
          ...docSnap.data()
        });
      }
      return null;
    } catch (error) {
      throw new Error(`Error finding admin: ${error.message}`);
    }
  }

  // READ - Find admin by email
  static async findByEmail(email) {
    try {
      const q = query(this.collection, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return new Admin({
          id: doc.id,
          ...doc.data()
        });
      }
      return null;
    } catch (error) {
      throw new Error(`Error finding admin by email: ${error.message}`);
    }
  }

  // READ - Get all admins (with optional filters)
  static async findAll(options = {}) {
    try {
      const { 
        activeOnly = true,
        orderByField = 'createdAt',
        orderDirection = 'desc'
      } = options;

      let q = query(this.collection);

      // Apply filters
      if (activeOnly) {
        q = query(q, where('isActive', '==', true));
      }

      // Apply ordering
      q = query(q, orderBy(orderByField, orderDirection));

      const querySnapshot = await getDocs(q);
      const admins = [];

      querySnapshot.forEach((doc) => {
        admins.push(new Admin({
          id: doc.id,
          ...doc.data()
        }));
      });

      return admins;
    } catch (error) {
      throw new Error(`Error fetching admins: ${error.message}`);
    }
  }

  // UPDATE - Update admin
  async update(updateData) {
    try {
      // Don't allow updating ID or changing role from admin
      const { id, role, ...safeUpdateData } = updateData;
      
      // Set updated timestamp
      safeUpdateData.updatedAt = new Date().toISOString();

      await updateDoc(Admin.doc(this.id), safeUpdateData);

      // Update current instance
      Object.assign(this, safeUpdateData);
      
      return this;
    } catch (error) {
      throw new Error(`Error updating admin: ${error.message}`);
    }
  }

  // UPDATE - Update permissions
  async updatePermissions(permissions) {
    try {
      if (!Array.isArray(permissions)) {
        throw new Error('Permissions must be an array');
      }

      await updateDoc(Admin.doc(this.id), {
        permissions,
        updatedAt: new Date().toISOString()
      });

      this.permissions = permissions;
      return this;
    } catch (error) {
      throw new Error(`Error updating permissions: ${error.message}`);
    }
  }

  // UPDATE - Update last login
  async updateLastLogin() {
    try {
      this.lastLogin = new Date().toISOString();
      await updateDoc(Admin.doc(this.id), {
        lastLogin: this.lastLogin,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      throw new Error(`Error updating last login: ${error.message}`);
    }
  }

  // CHECK - Verify if admin has specific permission
  hasPermission(permission) {
    return this.permissions.includes(permission);
  }

  // CHECK - Verify if admin has all specified permissions
  hasAllPermissions(requiredPermissions) {
    return requiredPermissions.every(permission => 
      this.permissions.includes(permission)
    );
  }

  // DELETE - Soft delete (recommended)
  async softDelete() {
    try {
      await this.update({
        isActive: false,
        deletedAt: new Date().toISOString()
      });
    } catch (error) {
      throw new Error(`Error soft deleting admin: ${error.message}`);
    }
  }

  // DELETE - Hard delete
  async delete() {
    try {
      await deleteDoc(Admin.doc(this.id));
    } catch (error) {
      throw new Error(`Error deleting admin: ${error.message}`);
    }
  }

  // REAL-TIME - Listen to admin changes
  static onAdminChange(id, callback) {
    const docRef = this.doc(id);
    
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const admin = new Admin({
          id: docSnap.id,
          ...docSnap.data()
        });
        callback(admin);
      } else {
        callback(null);
      }
    });
  }

  // VALIDATION - Check if admin exists
  static async exists(email) {
    try {
      const admin = await this.findByEmail(email);
      return admin !== null;
    } catch (error) {
      throw new Error(`Error checking admin existence: ${error.message}`);
    }
  }

  // BULK OPERATIONS - Create multiple admins
  static async createMultiple(adminsData) {
    try {
      const admins = [];
      
      for (const adminData of adminsData) {
        const admin = await this.create(adminData);
        admins.push(admin);
      }
      
      return admins;
    } catch (error) {
      throw new Error(`Error creating multiple admins: ${error.message}`);
    }
  }
}

export default Admin;