"use client"
import { useState, useEffect } from "react"
import { collection, doc, getDoc, updateDoc, query, where, onSnapshot, Timestamp } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { db, isDemoMode } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { ArrowLeft, BookOpen, Calendar, Clock, AlertTriangle } from "lucide-react"
import Navbar from "@/components/navbar"
import type { BorrowingItem } from "@/models/book"

// Sample data for demo mode
const sampleBorrowings = [
  {
    id: "1",
    bookId: "1",
    data: {
      borrowDate: { toDate: () => new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      returnDueDate: { toDate: () => new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) },
      isReturned: false,
      returnedAt: null,
    },
    bookData: {
      title: "The Psychology of Money",
      author: "Morgan Housel",
      coverUrl: "/placeholder.svg?height=300&width=200",
    },
  },
  {
    id: "2",
    bookId: "2",
    data: {
      borrowDate: { toDate: () => new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      returnDueDate: { toDate: () => new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      isReturned: false,
      returnedAt: null,
    },
    bookData: {
      title: "Atomic Habits",
      author: "James Clear",
      coverUrl: "/placeholder.svg?height=300&width=200",
    },
  },
]

export default function HistoryPage() {
  const [borrowings, setBorrowings] = useState<BorrowingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [demoMode, setDemoMode] = useState(isDemoMode)
  const router = useRouter()

  useEffect(() => {
    const auth = getAuth()

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        alert("Silakan login terlebih dahulu")
        router.push("/login")
        return
      }

      if (demoMode) {
        setBorrowings(sampleBorrowings as any)
        setLoading(false)
        return
      }

      const q = query(collection(db, "borrowings"), where("userId", "==", user.uid), where("isReturned", "==", false))

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const docs = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data()
            const bookId = data.bookId
            const bookRef = doc(db, "books", bookId)
            const bookSnap = await getDoc(bookRef)
            return {
              id: docSnap.id,
              bookId,
              data: data,
              bookData: bookSnap.data(),
            }
          }),
        )
        setBorrowings(docs as any)
        setLoading(false)
      })

      return () => unsubscribe()
    })

    return () => unsubscribeAuth()
  }, [demoMode, router])

  const handleReturnBook = async (borrowingId: string, bookId: string) => {
    if (demoMode) {
      setBorrowings(borrowings.filter((item) => item.id !== borrowingId))
      alert("Buku berhasil dikembalikan.")
      return
    }

    try {
      const now = Timestamp.now()

      await updateDoc(doc(db, "borrowings", borrowingId), {
        isReturned: true,
        returnedAt: now,
      })

      const bookRef = doc(db, "books", bookId)
      const bookSnap = await getDoc(bookRef)
      const currentStock = bookSnap.data()?.stock ?? 0
      await updateDoc(bookRef, { stock: currentStock + 1 })

      alert("Buku berhasil dikembalikan.")
    } catch (error) {
      console.error("Gagal mengembalikan buku:", error)
      alert("Terjadi kesalahan saat mengembalikan buku.")
    }
  }

  // Calculate days remaining until due date
  const getDaysRemaining = (dueDate: any) => {
    const now = new Date()
    const due = dueDate.toDate()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              aria-label="Back"
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Riwayat Peminjaman</h1>
          </div>
          <div className="bg-gold-100 text-gold-500 px-3 py-1 rounded-full text-sm font-medium">
            {borrowings.length} item
          </div>
        </div>

        {demoMode && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
            <p className="font-medium">Demo Mode Active</p>
            <p className="text-sm mt-1">Firebase is not configured. The app is running with sample borrowing data.</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-400"></div>
          </div>
        ) : borrowings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-800 mb-2">Tidak ada buku yang sedang dipinjam</h3>
            <p className="text-gray-600 mb-6">Semua buku telah dikembalikan</p>
            <button
              onClick={() => router.push("/home")}
              className="px-4 py-2 bg-gold-400 text-white rounded-lg hover:bg-gold-500 transition-colors"
            >
              Pinjam Buku
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {borrowings.map(({ id, bookId, data, bookData }) => {
              const daysRemaining = getDaysRemaining(data.returnDueDate)
              const isOverdue = daysRemaining < 0

              return (
                <div key={id} className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col sm:flex-row">
                  {/* Book Cover */}
                  <div className="w-full sm:w-[120px] h-[180px] sm:h-auto flex-shrink-0 overflow-hidden">
                    {bookData?.coverUrl?.startsWith("http") || bookData?.coverUrl?.startsWith("/") ? (
                      <img
                        src={bookData.coverUrl || "/placeholder.svg?height=180&width=120"}
                        alt={bookData.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).onerror = null
                          ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=180&width=120"
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex justify-center items-center bg-gray-100">
                        <BookOpen className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Book Details */}
                  <div className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg mb-1">
                        {bookData?.title || "Judul tidak tersedia"}
                      </h3>
                      <p className="text-gray-700 mb-3">{bookData?.author || "Penulis tidak tersedia"}</p>

                      <div className="space-y-1.5">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>Tanggal Pinjam: {data.borrowDate.toDate().toLocaleDateString()}</span>
                        </div>
                        <div className={`flex items-center text-sm ${isOverdue ? "text-red-600" : "text-gold-500"}`}>
                          {isOverdue ? <AlertTriangle className="h-4 w-4 mr-2" /> : <Clock className="h-4 w-4 mr-2" />}
                          <span>
                            {isOverdue
                              ? `Terlambat ${Math.abs(daysRemaining)} hari`
                              : `Tenggat: ${data.returnDueDate.toDate().toLocaleDateString()} (${daysRemaining} hari lagi)`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleReturnBook(id, bookId)}
                      className={`mt-4 px-4 py-2 rounded-lg font-medium text-white ${
                        isOverdue ? "bg-red-500 hover:bg-red-600" : "bg-gold-400 hover:bg-gold-500"
                      } transition-colors self-end`}
                    >
                      Kembalikan
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
