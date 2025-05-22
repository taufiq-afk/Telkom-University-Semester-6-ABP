export interface Book {
  id: string
  title: string
  author: string
  coverUrl: string
  description: string
  category: string
  stock: number
}

export interface BorrowingItem {
  id: string
  bookId: string
  userId: string
  title?: string
  borrowDate: Date
  returnDueDate: Date
  isReturned: boolean
  returnedAt: Date | null
  daysLate?: number
  damageCount?: number
  damageNote?: string
  fine?: number
}

export interface CartItem {
  id: string
  bookId: string
  title?: string
  author?: string
  coverUrl?: string
  quantity: number
  addedAt: Date
  stock?: number
}
