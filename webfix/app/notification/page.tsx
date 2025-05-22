"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Bell, AlertTriangle, Clock } from "lucide-react"
import { format } from "date-fns"
import { collection, query, where, onSnapshot, type QuerySnapshot, type DocumentData } from "firebase/firestore"
import { db, auth, isDemoMode } from "@/lib/firebase"
import Navbar from "@/components/navbar"

interface Borrowing {
  id: string
  title?: string
  returnDueDate: Date
}

// Sample data for demo mode
const sampleNotifications = [
  {
    id: "1",
    title: "The Psychology of Money",
    returnDueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
  },
  {
    id: "2",
    title: "Atomic Habits",
    returnDueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
]

export default function NotificationScreen() {
  const router = useRouter()
  const [borrowings, setBorrowings] = useState<Borrowing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [demoMode, setDemoMode] = useState(isDemoMode)

  useEffect(() => {
    if (demoMode) {
      setBorrowings(sampleNotifications)
      setLoading(false)
      return () => {}
    }

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setError("User belum login")
        setLoading(false)
        return
      }

      const q = query(collection(db, "borrowings"), where("userId", "==", user.uid))

      const unsubscribeFirestore = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const dataList: Borrowing[] = snapshot.docs
            .map((doc) => {
              const data = doc.data()
              if (!data.title) return null // skip jika title kosong
              return {
                id: doc.id,
                title: data.title,
                returnDueDate: data.returnDueDate?.toDate?.() ?? new Date("1970-01-01"),
              }
            })
            .filter(Boolean) as Borrowing[] // filter null
          setBorrowings(dataList)
          setLoading(false)
        },
        (err) => {
          setError("Terjadi kesalahan saat mengambil data.")
          setLoading(false)
        },
      )

      return () => unsubscribeFirestore()
    })

    return () => unsubscribeAuth()
  }, [demoMode])

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
            <h1 className="text-2xl font-bold text-gray-800">Notifikasi</h1>
          </div>
          <div className="bg-gold-100 text-gold-500 px-3 py-1 rounded-full text-sm font-medium">
            {borrowings.length} notifikasi
          </div>
        </div>

        {demoMode && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
            <p className="font-medium">Demo Mode Active</p>
            <p className="text-sm mt-1">
              Firebase is not configured. The app is running with sample notification data.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-400"></div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={() => router.push("/login")}
              className="mt-4 px-4 py-2 bg-gold-400 text-white rounded-lg hover:bg-gold-500 transition-colors"
            >
              Login
            </button>
          </div>
        ) : borrowings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-800 mb-2">Tidak ada notifikasi saat ini</h3>
            <p className="text-gray-600">Anda akan menerima notifikasi tentang peminjaman buku di sini</p>
          </div>
        ) : (
          <div className="space-y-4">
            {borrowings.map(({ id, title, returnDueDate }) => {
              const now = new Date()
              const isOverdue = returnDueDate < now
              const daysLeft = Math.max(0, Math.ceil((returnDueDate.getTime() - now.getTime()) / (1000 * 3600 * 24)))

              let message = ""
              if (isOverdue) {
                message = "Sudah melewati batas pengembalian!"
              } else {
                message = daysLeft === 0 ? "Harus dikembalikan hari ini!" : `Sisa ${daysLeft} hari untuk mengembalikan.`
              }

              return (
                <div
                  key={id}
                  className={`bg-white rounded-xl shadow-sm overflow-hidden border-l-4 ${
                    isOverdue ? "border-red-500" : "border-gold-400"
                  }`}
                >
                  <div className="p-4 flex gap-4">
                    <div
                      className={`flex-shrink-0 rounded-full p-3 ${
                        isOverdue ? "bg-red-100 text-red-500" : "bg-gold-100 text-gold-500"
                      }`}
                    >
                      {isOverdue ? <AlertTriangle className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
                    </div>
                    <div className="flex-grow">
                      <h2 className="font-bold text-lg text-gray-800">{title}</h2>
                      <p className="text-gray-600 text-sm">
                        Batas pengembalian: {format(returnDueDate, "dd MMM yyyy")}
                      </p>
                      <p className={`text-sm font-medium mt-1 ${isOverdue ? "text-red-600" : "text-gold-500"}`}>
                        {message}
                      </p>
                    </div>
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
