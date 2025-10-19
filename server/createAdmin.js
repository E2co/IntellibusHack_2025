import bcrypt from 'bcryptjs';
import { db } from './configs/db.js';
import { collection, addDoc } from 'firebase/firestore';

const createAdminUser = async () => {
  try {
    console.log('Creating admin user...');
    
    const passwordHash = await bcrypt.hash('admin123', 10);
    const adminData = {
      email: 'admin@intellibus.com',
      name: 'System Administrator',
      role: 'admin',
      isActive: true,
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: null,
      profile: {
        idNumber: 'ADMIN001',
      },
      preferences: {}
    };

    const docRef = await addDoc(collection(db, 'users'), adminData);
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@intellibus.com');
    console.log('🔑 Password: admin123');
    console.log('🆔 ID Number: ADMIN001');
    console.log('📄 Document ID:', docRef.id);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser();
