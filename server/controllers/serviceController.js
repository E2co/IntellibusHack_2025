import { db } from '../configs/db.js'
import { collection, getDocs, query, where, addDoc, doc, getDoc, updateDoc, setDoc, limit } from 'firebase/firestore'

const servicesCol = () => collection(db, 'services')
const nowIso = () => new Date().toISOString()

const toPublic = (docSnap) => {
  const d = docSnap.data() || {}
  return {
    id: docSnap.id,
    code: d.code,
    name: d.name,
    description: d.description || '',
    isActive: d.isActive !== undefined ? d.isActive : true,
    order: typeof d.order === 'number' ? d.order : 0,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    meta: d.meta || {}
  }
}

export const listServices = async (req, res) => {
  try {
    const snap = await getDocs(servicesCol())
    const items = snap.docs
      .map(toPublic)
      .filter(s => s.isActive)
      .sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name))
    return res.json({ success: true, services: items })
  } catch (err) {
    console.error('listServices error', err)
    return res.status(500).json({ success: false, message: 'Failed to list services' })
  }
}

export const adminCreateService = async (req, res) => {
  try {
    const { code, name, description = '', isActive = true, order = 0, meta = {} } = req.body || {}
    if (!code || !name) {
      return res.status(400).json({ success: false, message: 'code and name are required' })
    }
    const normalizedCode = String(code).trim().toUpperCase()

    const q = query(servicesCol(), where('code', '==', normalizedCode), limit(1))
    const existsSnap = await getDocs(q)
    if (!existsSnap.empty) {
      return res.status(409).json({ success: false, message: 'Service code already exists' })
    }

    const data = {
      code: normalizedCode,
      name: String(name).trim(),
      description,
      isActive: !!isActive,
      order: Number.isFinite(order) ? order : 0,
      meta,
      createdAt: nowIso(),
      updatedAt: nowIso()
    }
    const docRef = await addDoc(servicesCol(), data)
    const docSnap = await getDoc(docRef)
    return res.status(201).json({ success: true, service: toPublic(docSnap) })
  } catch (err) {
    console.error('adminCreateService error', err)
    return res.status(500).json({ success: false, message: 'Failed to create service' })
  }
}

export const adminUpdateService = async (req, res) => {
  try {
    const { id } = req.params
    if (!id) return res.status(400).json({ success: false, message: 'id is required' })
    const allowed = ['name', 'description', 'isActive', 'order', 'meta']
    const updates = {}
    for (const k of allowed) if (k in (req.body || {})) updates[k] = req.body[k]
    updates.updatedAt = nowIso()

    const docRef = doc(db, 'services', id)
    const before = await getDoc(docRef)
    if (!before.exists()) return res.status(404).json({ success: false, message: 'Service not found' })

    await updateDoc(docRef, updates)
    const after = await getDoc(docRef)
    return res.json({ success: true, service: toPublic(after) })
  } catch (err) {
    console.error('adminUpdateService error', err)
    return res.status(500).json({ success: false, message: 'Failed to update service' })
  }
}

export const seedServices = async (req, res) => {
  try {
    const seeds = [
      {
        code: 'CASHIER',
        name: 'Cashier',
        description: 'Payment processing and financial transactions',
        isActive: true,
        order: 1,
        meta: { icon: 'dollar-sign' }
      },
      {
        code: 'TITLES',
        name: 'Titles',
        description: 'Document titles, property titles, and registrations',
        isActive: true,
        order: 2,
        meta: { icon: 'file-text' }
      },
      {
        code: 'LICENSE',
        name: 'License',
        description: 'Driver licenses, permits, and certifications',
        isActive: true,
        order: 3,
        meta: { icon: 'credit-card' }
      },
      {
        code: 'TRN',
        name: 'TRN',
        description: 'Tax Registration Number applications and services',
        isActive: true,
        order: 4,
        meta: { icon: 'hash' }
      },
      {
        code: 'OTHER',
        name: 'Other Services',
        description: 'Additional government services and inquiries',
        isActive: true,
        order: 5,
        meta: { icon: 'more-horizontal' }
      }
    ]

    const results = { created: 0, updated: 0, skipped: 0 }

    for (const s of seeds) {
      const code = s.code.toUpperCase().trim()
      const q = query(servicesCol(), where('code', '==', code), limit(1))
      const querySnap = await getDocs(q)
      if (querySnap.empty) {
        await addDoc(servicesCol(), { ...s, code, createdAt: nowIso(), updatedAt: nowIso() })
        results.created++
      } else {
        const docSnap = querySnap.docs[0]
        const data = docSnap.data() || {}
        const needsUpdate = (
          data.name !== s.name ||
          data.description !== s.description ||
          data.isActive !== s.isActive ||
          (Number.isFinite(data.order) ? data.order : 0) !== s.order ||
          JSON.stringify(data.meta || {}) !== JSON.stringify(s.meta || {})
        )
        if (needsUpdate) {
          const docRef = doc(db, 'services', docSnap.id)
          await updateDoc(docRef, { ...s, code, updatedAt: nowIso() })
          results.updated++
        } else {
          results.skipped++
        }
      }
    }

    return res.json({ success: true, results })
  } catch (err) {
    console.error('seedServices error', err)
    return res.status(500).json({ success: false, message: 'Failed to seed services' })
  }
}

export default { listServices, adminCreateService, adminUpdateService, seedServices }
