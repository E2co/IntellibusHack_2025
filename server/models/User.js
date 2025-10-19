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

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.name = data.name;
    this.role = data.role || 'user'; // Default role is 'user'
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.lastLogin = data.lastLogin || null;
    this.profile = data.profile || {
      phone: '',
      address: '',
      dateOfBirth: '',
      avatar: ''
    };
    this.preferences = data.preferences || {
      notifications: true,
      newsletter: false,
      theme: 'light'
    };
  }

  // Static collection reference
  static get collection() {
    return collection(db, 'users');
  }

  // Document reference by ID
  static doc(id) {
    return doc(db, 'users', id);
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
      preferences: this.preferences
    };
  }

  // CREATE - Add new user
  static async create(userData) {
    try {
      const user = new User(userData);
      const docRef = await addDoc(this.collection, user.toJSON());
      
      // Return user with ID
      return new User({
        id: docRef.id,
        ...user.toJSON()
      });
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  // READ - Find user by ID
  static async findById(id) {
    try {
      const docRef = this.doc(id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return new User({
          id: docSnap.id,
          ...docSnap.data()
        });
      }
      return null;
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  // READ - Find user by email
  static async findByEmail(email) {
    try {
      const q = query(this.collection, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return new User({
          id: doc.id,
          ...doc.data()
        });
      }
      return null;
    } catch (error) {
      throw new Error(`Error finding user by email: ${error.message}`);
    }
  }

  // READ - Get all users (with optional filters)
  static async findAll(options = {}) {
    try {
      const { 
        activeOnly = true,
        orderByField = 'createdAt',
        orderDirection = 'desc',
        role = ''
      } = options;

      let q = query(this.collection);

      // Apply filters
      if (activeOnly) {
        q = query(q, where('isActive', '==', true));
      }

      // Apply role filter
      if (role) {
        q = query(q, where('role', '==', role));
      }

      // Apply ordering
      q = query(q, orderBy(orderByField, orderDirection));

      const querySnapshot = await getDocs(q);
      const users = [];

      querySnapshot.forEach((doc) => {
        users.push(new User({
          id: doc.id,
          ...doc.data()
        }));
      });

      return users;
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  }

  // UPDATE - Update user
  async update(updateData) {
    try {
      // Don't allow updating ID or role through regular update
      const { id, role, ...safeUpdateData } = updateData;
      
      // Set updated timestamp
      safeUpdateData.updatedAt = new Date().toISOString();

      await updateDoc(User.doc(this.id), safeUpdateData);

      // Update current instance
      Object.assign(this, safeUpdateData);
      
      return this;
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  // UPDATE - Update user profile
  async updateProfile(profileData) {
    try {
      const updatedProfile = { ...this.profile, ...profileData };
      
      await updateDoc(User.doc(this.id), {
        profile: updatedProfile,
        updatedAt: new Date().toISOString()
      });

      this.profile = updatedProfile;
      return this;
    } catch (error) {
      throw new Error(`Error updating user profile: ${error.message}`);
    }
  }

  // UPDATE - Update user preferences
  async updatePreferences(preferencesData) {
    try {
      const updatedPreferences = { ...this.preferences, ...preferencesData };
      
      await updateDoc(User.doc(this.id), {
        preferences: updatedPreferences,
        updatedAt: new Date().toISOString()
      });

      this.preferences = updatedPreferences;
      return this;
    } catch (error) {
      throw new Error(`Error updating user preferences: ${error.message}`);
    }
  }

  // UPDATE - Update last login
  async updateLastLogin() {
    try {
      this.lastLogin = new Date().toISOString();
      await updateDoc(User.doc(this.id), {
        lastLogin: this.lastLogin,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      throw new Error(`Error updating last login: ${error.message}`);
    }
  }

  // PROMOTE - Promote user to admin (only for admin use)
  async promoteToAdmin() {
    try {
      await updateDoc(User.doc(this.id), {
        role: 'admin',
        updatedAt: new Date().toISOString()
      });

      this.role = 'admin';
      return this;
    } catch (error) {
      throw new Error(`Error promoting user to admin: ${error.message}`);
    }
  }

  // DELETE - Soft delete (recommended)
  async softDelete() {
    try {
      await this.update({
        isActive: false,
        deletedAt: new Date().toISOString()
      });
    } catch (error) {
      throw new Error(`Error soft deleting user: ${error.message}`);
    }
  }

  // DELETE - Hard delete
  async delete() {
    try {
      await deleteDoc(User.doc(this.id));
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  // REAL-TIME - Listen to user changes
  static onUserChange(id, callback) {
    const docRef = this.doc(id);
    
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const user = new User({
          id: docSnap.id,
          ...docSnap.data()
        });
        callback(user);
      } else {
        callback(null);
      }
    });
  }

  // VALIDATION - Check if user exists
  static async exists(email) {
    try {
      const user = await this.findByEmail(email);
      return user !== null;
    } catch (error) {
      throw new Error(`Error checking user existence: ${error.message}`);
    }
  }

  // COUNT - Get total user count
  static async getCount(activeOnly = true) {
    try {
      const users = await this.findAll({ activeOnly });
      return users.length;
    } catch (error) {
      throw new Error(`Error getting user count: ${error.message}`);
    }
  }

  // BULK OPERATIONS - Create multiple users
  static async createMultiple(usersData) {
    try {
      const users = [];
      
      for (const userData of usersData) {
        const user = await this.create(userData);
        users.push(user);
      }
      
      return users;
    } catch (error) {
      throw new Error(`Error creating multiple users: ${error.message}`);
    }
  }
}

export default User;