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

export default { register, login, me, logout };