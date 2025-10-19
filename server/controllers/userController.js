import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../configs/db.js';
import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc, limit } from 'firebase/firestore';
import { getJwtSecret } from '../configs/jwt.js';

// Helpers
const usersCol = () => collection(db, 'users');
const nowIso = () => new Date().toISOString();
const buildProfile = (docSnap) => {
  if (!docSnap || !docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    id: docSnap.id,
    email: data.email,
    name: data.name,
    role: data.role || 'user',
    isActive: data.isActive !== undefined ? data.isActive : true,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    lastLogin: data.lastLogin || null,
    profile: data.profile || {},
    preferences: data.preferences || {}
  };
};

const makeCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    // maxAge: 7 days
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
};

export const register = async (req, res) => {
  try {
    const { email, name, password } = req.body || {};
    if (!email || !name || !password) {
      return res.status(400).json({ success: false, message: 'email, name, and password are required' });
    }

    const q = query(usersCol(), where('email', '==', email), limit(1));
    const existsSnap = await getDocs(q);
    if (!existsSnap.empty) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userData = {
      email,
      name,
      role: 'user',
      isActive: true,
      passwordHash,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      lastLogin: null,
      profile: {},
      preferences: {}
    };

    const docRef = await addDoc(usersCol(), userData);
    const token = jwt.sign({ id: docRef.id }, getJwtSecret(), { expiresIn: '7d' });

    res.cookie('token', token, makeCookieOptions());
    const docSnap = await getDoc(docRef);
    return res.status(201).json({ success: true, user: buildProfile(docSnap) });
  } catch (err) {
    console.error('register error', err);
    return res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required' });
    }

    const q = query(usersCol(), where('email', '==', email), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const docSnap = snap.docs[0];
    const data = docSnap.data();
    if (!data.passwordHash) {
      return res.status(400).json({ success: false, message: 'User has no password set' });
    }

    const ok = await bcrypt.compare(password, data.passwordHash);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update lastLogin
    const userDocRef = doc(db, 'users', docSnap.id);
    await updateDoc(userDocRef, { lastLogin: nowIso(), updatedAt: nowIso() });

    const token = jwt.sign({ id: docSnap.id }, getJwtSecret(), { expiresIn: '7d' });
    res.cookie('token', token, makeCookieOptions());
    return res.json({ success: true, user: buildProfile(docSnap) });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
};

export const me = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not Authorized' });
    }

    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({ success: true, user: buildProfile(docSnap) });
  } catch (err) {
    console.error('me error', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie('token', makeCookieOptions());
    return res.json({ success: true });
  } catch (err) {
    console.error('logout error', err);
    return res.status(500).json({ success: false, message: 'Logout failed' });
  }
};

// Admin-specific auth endpoints
export const adminLogin = async (req, res) => {
  try {
    const { email, password, idNumber } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required' });
    }

    const q = query(usersCol(), where('email', '==', email), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const docSnap = snap.docs[0];
    const data = docSnap.data();
    
    // Check if user is admin
    if (data.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin credentials required.' });
    }

    if (!data.passwordHash) {
      return res.status(400).json({ success: false, message: 'Admin has no password set' });
    }

    const ok = await bcrypt.compare(password, data.passwordHash);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Optional: Verify ID number if provided
    if (idNumber && data.profile?.idNumber && data.profile.idNumber !== idNumber) {
      return res.status(401).json({ success: false, message: 'Invalid ID number' });
    }

    // Update lastLogin
    const userDocRef = doc(db, 'users', docSnap.id);
    await updateDoc(userDocRef, { lastLogin: nowIso(), updatedAt: nowIso() });

    const token = jwt.sign({ id: docSnap.id, role: 'admin' }, getJwtSecret(), { expiresIn: '7d' });
    res.cookie('token', token, makeCookieOptions());
    
    const profile = buildProfile(docSnap);
    return res.json({ success: true, admin: profile });
  } catch (err) {
    console.error('adminLogin error', err);
    return res.status(500).json({ success: false, message: 'Admin login failed' });
  }
};

export const adminRegister = async (req, res) => {
  try {
    const { email, name, password, idNumber, inviteCode } = req.body || {};
    
    // Validate required fields
    if (!email || !name || !password || !idNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'email, name, password, and idNumber are required' 
      });
    }

    // Optional: Validate invite code for admin registration
    const ADMIN_INVITE_CODE = process.env.ADMIN_INVITE_CODE || 'TAJ_ADMIN_2025';
    if (inviteCode !== ADMIN_INVITE_CODE) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid invite code. Admin registration requires authorization.' 
      });
    }

    const q = query(usersCol(), where('email', '==', email), limit(1));
    const existsSnap = await getDocs(q);
    if (!existsSnap.empty) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const adminData = {
      email,
      name,
      role: 'admin',
      isActive: true,
      passwordHash,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      lastLogin: null,
      profile: {
        idNumber,
      },
      preferences: {}
    };

    const docRef = await addDoc(usersCol(), adminData);
    const token = jwt.sign({ id: docRef.id, role: 'admin' }, getJwtSecret(), { expiresIn: '7d' });

    res.cookie('token', token, makeCookieOptions());
    const docSnap = await getDoc(docRef);
    return res.status(201).json({ success: true, admin: buildProfile(docSnap) });
  } catch (err) {
    console.error('adminRegister error', err);
    return res.status(500).json({ success: false, message: 'Admin registration failed' });
  }
};

export default { register, login, me, logout, adminLogin, adminRegister };