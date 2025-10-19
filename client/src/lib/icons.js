import { Hash, FileText, DollarSign, CreditCard, MoreHorizontal } from 'lucide-react'

export function iconForService(code) {
  const key = String(code || '').toUpperCase()
  switch (key) {
    case 'CASHIER':
      return DollarSign
    case 'TITLES':
      return FileText
    case 'LICENSE':
      return CreditCard
    case 'TRN':
      return Hash
    case 'OTHER':
      return MoreHorizontal
    default:
      return MoreHorizontal
  }
}
