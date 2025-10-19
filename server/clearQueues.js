// Quick script to clear all queues and tickets
import 'dotenv/config'
import './configs/db.js'
import { clearAllQueues } from './controllers/ticketController.js'

const mockReq = {}
const mockRes = {
  json: (data) => {
    console.log('Result:', JSON.stringify(data, null, 2))
    process.exit(0)
  },
  status: (code) => ({
    json: (data) => {
      console.log('Status:', code)
      console.log('Result:', JSON.stringify(data, null, 2))
      process.exit(1)
    }
  })
}

console.log('Clearing all queues and tickets...')
clearAllQueues(mockReq, mockRes).catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
