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

    // Query only by userId to avoid composite index requirement
    // Then filter and sort in-memory
    const q = query(ticketsCol(), where('userId', '==', userId))
    const querySnap = await getDocs(q)

    if (querySnap.empty) {
      return res.json({ success: true, ticket: null })
    }

    // Filter and sort tickets in-memory
    const tickets = querySnap.docs
      .map(doc => ({ docSnap: doc, data: doc.data() }))
      .filter(t => t.data.status === 'waiting' || t.data.status === 'called')
      .sort((a, b) => {
        // Prefer 'waiting' over 'called'
        if (a.data.status !== b.data.status) {
          return a.data.status === 'waiting' ? -1 : 1
        }
        // Then sort by createdAt descending
        return (b.data.createdAt || '').localeCompare(a.data.createdAt || '')
      })

    if (tickets.length > 0) {
      const picked = tickets[0]
      const tData = picked.data

      // Compute accurate queue context: currentNumber, totalInQueue, and position (people ahead)
      let currentNumber = 0
      let totalInQueue = 0
      let positionAhead = 0
      try {
        // Get queue counters
        const qRef = doc(db, 'queues', tData.serviceId)
        const qSnap = await getDoc(qRef)
        currentNumber = (qSnap.exists() ? (qSnap.data()?.currentNumber || 0) : 0)

        // Count waiting tickets for this service and compute how many are ahead
        const sSnap = await getDocs(query(ticketsCol(), where('serviceId', '==', tData.serviceId)))
        const waiting = sSnap.docs.filter(d => (d.data()?.status === 'waiting'))
        totalInQueue = waiting.length
        positionAhead = waiting.filter(d => {
          const num = d.data()?.number || 0
          return num > currentNumber && num < (tData.number || 0)
        }).length
      } catch (e) {
        // Fallbacks already set to 0; ignore
      }

      const pub = toPublicTicket(picked.docSnap)
      return res.json({ success: true, ticket: { ...pub, currentNumber, totalInQueue, position: positionAhead } })
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

    // Query only by userId to avoid composite index requirement
    const q = query(ticketsCol(), where('userId', '==', userId))
    const querySnap = await getDocs(q)

    if (querySnap.empty) {
      return res.status(404).json({ success: false, message: 'No active ticket' })
    }

    // Find most recent waiting ticket in-memory
    const waitingTickets = querySnap.docs
      .filter(doc => doc.data().status === 'waiting')
      .sort((a, b) => (b.data().createdAt || '').localeCompare(a.data().createdAt || ''))

    if (waitingTickets.length === 0) {
      return res.status(404).json({ success: false, message: 'No active ticket' })
    }

    const ticketDocSnap = waitingTickets[0]
    const data = ticketDocSnap.data()
    const serviceId = data.serviceId
    const ticketNumber = data.number

    console.log('Canceling ticket:', ticketDocSnap.id, 'number:', ticketNumber, 'for service:', serviceId)

    await runTransaction(db, async (tx) => {
      const queueRef = doc(db, 'queues', serviceId)
      const queueSnap = await tx.get(queueRef)
      
      if (!queueSnap.exists()) {
        console.log('Queue does not exist for service:', serviceId)
        const ticketRef = doc(db, 'tickets', ticketDocSnap.id)
        tx.update(ticketRef, { status: 'canceled', updatedAt: nowIso() })
        return
      }

      const queue = queueSnap.data()
      console.log('Current queue state:', queue)

      // Count actual waiting tickets for this service (excluding the one being canceled)
      const allServiceTicketsQuery = query(ticketsCol(), where('serviceId', '==', serviceId))
      const allServiceTicketsSnap = await getDocs(allServiceTicketsQuery)
      
      const actualWaitingCount = allServiceTicketsSnap.docs.filter(doc => {
        const ticketData = doc.data()
        return ticketData.status === 'waiting' && doc.id !== ticketDocSnap.id
      }).length

      console.log('Actual waiting count after cancellation:', actualWaitingCount)

      // Update the ticket to canceled
      const ticketRef = doc(db, 'tickets', ticketDocSnap.id)
      tx.update(ticketRef, { status: 'canceled', updatedAt: nowIso() })
      
      // Update queue with accurate waiting count
      tx.update(queueRef, { 
        waitingCount: actualWaitingCount,
        updatedAt: nowIso() 
      })
    })

    console.log('Ticket canceled successfully')
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

// Clear all queues and tickets (for development/testing)
export const clearAllQueues = async (req, res) => {
  try {
    console.log('Clearing all queues and tickets...')
    
    // Clear all tickets
    const ticketsSnap = await getDocs(ticketsCol())
    const ticketDeletes = ticketsSnap.docs.map(async (docSnap) => {
      await updateDoc(doc(db, 'tickets', docSnap.id), { status: 'canceled', updatedAt: nowIso() })
    })
    await Promise.all(ticketDeletes)
    
    // Clear all queues
    const queuesSnap = await getDocs(queuesCol())
    const queueUpdates = queuesSnap.docs.map(async (docSnap) => {
      await updateDoc(doc(db, 'queues', docSnap.id), { 
        lastNumber: 0, 
        currentNumber: 0, 
        waitingCount: 0, 
        updatedAt: nowIso() 
      })
    })
    await Promise.all(queueUpdates)
    
    console.log(`Cleared ${ticketsSnap.size} tickets and ${queuesSnap.size} queues`)
    return res.json({ 
      success: true, 
      cleared: { 
        tickets: ticketsSnap.size, 
        queues: queuesSnap.size 
      } 
    })
  } catch (err) {
    console.error('clearAllQueues error', err)
    return res.status(500).json({ success: false, message: 'Failed to clear queues' })
  }
}

export default { createTicket, getMyTicket, cancelMyTicket, getPublicTraffic, adminAdvanceQueue, clearAllQueues }
