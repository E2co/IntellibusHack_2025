import { db } from '../configs/db.js'
import { collection, getDocs, query, where, addDoc, doc, getDoc, updateDoc, setDoc, orderBy, limit, runTransaction } from 'firebase/firestore'

const ticketsCol = () => collection(db, 'tickets')
const queuesCol = () => collection(db, 'queues')
const nowIso = () => new Date().toISOString()

const toPublicTicket = (docSnap) => {
  const d = docSnap.data() || {}
  return {
    id: docSnap.id,
    serviceId: d.serviceId,
    userId: d.userId,
    number: d.number,
    status: d.status,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    calledAt: d.calledAt || null,
  }
}

export const createTicket = async (req, res) => {
  try {
    const userId = req.userId
    const { serviceId } = req.body || {}
    if (!userId) return res.status(401).json({ success: false, message: 'Not Authorized' })
    if (!serviceId) return res.status(400).json({ success: false, message: 'serviceId is required' })

    const result = await runTransaction(db, async (tx) => {
      const queueRef = doc(db, 'queues', serviceId)
      const queueSnap = await tx.get(queueRef)
      let queue = queueSnap.exists() ? queueSnap.data() : { lastNumber: 0, currentNumber: 0, waitingCount: 0 }

      const newNumber = (queue.lastNumber || 0) + 1
      const createdAt = nowIso()
      const ticketRef = doc(collection(db, 'tickets'))
      const ticketData = {
        serviceId,
        userId,
        number: newNumber,
        status: 'waiting',
        createdAt,
        updatedAt: createdAt,
      }

      if (!queueSnap.exists()) {
        tx.set(queueRef, {
          lastNumber: newNumber,
          currentNumber: queue.currentNumber || 0,
          waitingCount: (queue.waitingCount || 0) + 1,
          updatedAt: createdAt,
        })
      } else {
        tx.update(queueRef, {
          lastNumber: newNumber,
          waitingCount: (queue.waitingCount || 0) + 1,
          updatedAt: createdAt,
        })
      }

      tx.set(ticketRef, ticketData)
      return { id: ticketRef.id, ...ticketData }
    })

    return res.status(201).json({ success: true, ticket: result })
  } catch (err) {
    console.error('createTicket error', err)
    return res.status(500).json({ success: false, message: 'Failed to create ticket' })
  }
}

export const getMyTicket = async (req, res) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ success: false, message: 'Not Authorized' })

    // Prefer 'waiting' then fallback to 'called' without using 'in' to avoid index requirements
    const waitingQ = query(ticketsCol(), where('userId', '==', userId), where('status', '==', 'waiting'), orderBy('createdAt', 'desc'), limit(1))
    const waitingSnap = await getDocs(waitingQ)

    if (!waitingSnap.empty) {
      return res.json({ success: true, ticket: toPublicTicket(waitingSnap.docs[0]) })
    }

    const calledQ = query(ticketsCol(), where('userId', '==', userId), where('status', '==', 'called'), orderBy('createdAt', 'desc'), limit(1))
    const calledSnap = await getDocs(calledQ)

    if (!calledSnap.empty) {
      return res.json({ success: true, ticket: toPublicTicket(calledSnap.docs[0]) })
    }

    return res.json({ success: true, ticket: null })
  } catch (err) {
    console.error('getMyTicket error', err)
    return res.status(500).json({ success: false, message: 'Failed to fetch ticket' })
  }
}

export const cancelMyTicket = async (req, res) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ success: false, message: 'Not Authorized' })

    const q = query(ticketsCol(), where('userId', '==', userId), where('status', '==', 'waiting'), orderBy('createdAt', 'desc'), limit(1))
    const querySnap = await getDocs(q)

    if (querySnap.empty) return res.status(404).json({ success: false, message: 'No active ticket' })
    const ticketDocSnap = querySnap.docs[0]
    const data = ticketDocSnap.data()
    const serviceId = data.serviceId

    await runTransaction(db, async (tx) => {
      const queueRef = doc(db, 'queues', serviceId)
      const queueSnap = await tx.get(queueRef)
      const queue = queueSnap.exists() ? queueSnap.data() : { waitingCount: 0 }

      const ticketRef = doc(db, 'tickets', ticketDocSnap.id)
      tx.update(ticketRef, { status: 'canceled', updatedAt: nowIso() })
      if (!queueSnap.exists()) {
        tx.set(queueRef, { lastNumber: 0, currentNumber: 0, waitingCount: 0, updatedAt: nowIso() })
      } else {
        tx.update(queueRef, { waitingCount: Math.max((queue.waitingCount || 0) - 1, 0), updatedAt: nowIso() })
      }
    })

    return res.json({ success: true })
  } catch (err) {
    console.error('cancelMyTicket error', err)
    return res.status(500).json({ success: false, message: 'Failed to cancel ticket' })
  }
}

export const getPublicTraffic = async (req, res) => {
  try {
    // For each service, join with queue doc
    const servicesSnap = await getDocs(collection(db, 'services'))
    const services = servicesSnap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }))
    
    // If there are no services, return early
    if (!services.length) {
      return res.json({ success: true, traffic: [] })
    }

    // Fetch queues individually for each service (client SDK doesn't have getAll)
    const byId = new Map()
    await Promise.all(services.map(async (s) => {
      const queueRef = doc(db, 'queues', s.id)
      const queueSnap = await getDoc(queueRef)
      byId.set(s.id, queueSnap.exists() ? queueSnap.data() : { waitingCount: 0, currentNumber: 0, lastNumber: 0 })
    }))

    const results = services
      .filter(s => s.isActive !== false)
      .map(s => {
        const q = byId.get(s.id) || { waitingCount: 0, currentNumber: 0, lastNumber: 0 }
        return {
          serviceId: s.id,
          code: s.code,
          name: s.name,
          totalInQueue: q.waitingCount || 0,
          currentNumber: q.currentNumber || 0,
          lastNumber: q.lastNumber || 0,
        }
      })

    return res.json({ success: true, traffic: results })
  } catch (err) {
    console.error('getPublicTraffic error', err)
    return res.status(500).json({ success: false, message: 'Failed to load public traffic' })
  }
}

export const adminAdvanceQueue = async (req, res) => {
  try {
    const { serviceId } = req.params
    if (!serviceId) return res.status(400).json({ success: false, message: 'serviceId required' })

    const result = await runTransaction(db, async (tx) => {
      const queueRef = doc(db, 'queues', serviceId)
      const queueSnap = await tx.get(queueRef)
      if (!queueSnap.exists()) return null
      const q = queueSnap.data() || { currentNumber: 0, lastNumber: 0, waitingCount: 0 }

      const nextNumber = (q.currentNumber || 0) + 1
      if (nextNumber > (q.lastNumber || 0) || (q.waitingCount || 0) <= 0) {
        return { advanced: false }
      }

      const tQuery = query(ticketsCol(), where('serviceId', '==', serviceId), where('number', '==', nextNumber), limit(1))
      const tSnap = await getDocs(tQuery)
      if (tSnap.empty) {
        // No ticket at that number; skip ahead by updating currentNumber
        tx.update(queueRef, { currentNumber: nextNumber, updatedAt: nowIso(), waitingCount: Math.max((q.waitingCount || 0) - 1, 0) })
        return { advanced: true, skipped: true }
      }

      const tDocSnap = tSnap.docs[0]
      const ticketRef = doc(db, 'tickets', tDocSnap.id)
      tx.update(ticketRef, { status: 'called', calledAt: nowIso(), updatedAt: nowIso() })
      tx.update(queueRef, { currentNumber: nextNumber, updatedAt: nowIso(), waitingCount: Math.max((q.waitingCount || 0) - 1, 0) })
      return { advanced: true, ticket: { id: tDocSnap.id, ...toPublicTicket(tDocSnap) } }
    })

    if (!result) return res.status(404).json({ success: false, message: 'Queue not found' })
    return res.json({ success: true, ...result })
  } catch (err) {
    console.error('adminAdvanceQueue error', err)
    return res.status(500).json({ success: false, message: 'Failed to advance queue' })
  }
}

export default { createTicket, getMyTicket, cancelMyTicket, getPublicTraffic, adminAdvanceQueue }
