import { db } from '../configs/db.js'
import { doc, getDoc } from 'firebase/firestore'

const authAdmin = async (req, res, next) => {
	try {
		const userId = req.userId
		if (!userId) return res.status(401).json({ success: false, message: 'Not Authorized' })

		const userDocRef = doc(db, 'users', userId)
		const docSnap = await getDoc(userDocRef)
		if (!docSnap.exists()) return res.status(401).json({ success: false, message: 'Not Authorized' })
		const data = docSnap.data() || {}
		if (data.isActive === false) return res.status(403).json({ success: false, message: 'Account disabled' })
		if ((data.role || 'user') !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' })

		req.user = { id: docSnap.id, email: data.email, role: data.role }
		return next()
	} catch (err) {
		console.error('authAdmin error', err)
		return res.status(500).json({ success: false, message: 'Authorization failed' })
	}
}

export default authAdmin
