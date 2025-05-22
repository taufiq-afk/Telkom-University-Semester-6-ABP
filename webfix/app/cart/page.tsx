"use client"
import { useState, useEffect } from "react"
import { collection, deleteDoc, doc, getDoc, Timestamp, updateDoc, addDoc, onSnapshot } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { db, isDemoMode } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { ArrowLeft, BookOpen, Trash2, ShoppingCart, Check, AlertCircle } from "lucide-react"
import Navbar from "@/components/navbar"
import type { CartItem } from "@/models/book"

// Sample data for demo mode
const sampleCartItems = [
  {
    id: "1",
    bookId: "1",
    data: {
      title: "The Psychology of Money",
      author: "Morgan Housel",
      coverUrl: "/placeholder.svg?height=300&width=200",
      stock: 5,
    },
  },
  {
    id: "2",
    bookId: "2",
    data: {
      title: "Atomic Habits",
      author: "James Clear",
      coverUrl: "/placeholder.svg?height=300&width=200",
      stock: 3,
    },
  },
]

export default function CartScreen() {
  const [cartItems, setCartItems] = useState<{ id: string; data: any }[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set())
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
        setCartItems(sampleCartItems)
        setLoading(false)
        return
      }

      const itemsRef = collection(db, "cart", user.uid, "items")
      const unsubscribeItems = onSnapshot(itemsRef, async (snapshot) => {
        const cartData = snapshot.docs.map((doc) => ({
          id: doc.id,
          data: doc.data() as CartItem,
        }))

        const updatedCartItems = await Promise.all(
          cartData.map(async (item) => {
            const bookRef = doc(db, "books", item.id)
            const bookSnap = await getDoc(bookRef)
            return {
              id: item.id,
              data: {
                ...item.data,
                stock: bookSnap.exists() ? (bookSnap.data()?.stock ?? 0) : 0,
              },
            }
          }),
        )

        setCartItems(updatedCartItems)
        setLoading(false)
      })

      return () => unsubscribeItems()
    })

    return () => unsubscribeAuth()
  }, [demoMode, router])

  const toggleSelected = (bookId: string) => {
    setSelectedBooks((prev) => {
      const updated = new Set(prev)
      updated.has(bookId) ? updated.delete(bookId) : updated.add(bookId)
      return updated
    })
  }

  const handleDelete = async (bookId: string) => {
    if (demoMode) {
      setCartItems(cartItems.filter((item) => item.id !== bookId))
      return
    }

    const user = getAuth().currentUser
    if (!user) return
    await deleteDoc(doc(db, "cart", user.uid, "items", bookId))
  }

  const borrowSelectedBooks = async () => {
    if (demoMode) {
      alert("Demo Mode: Books borrowed successfully!")
      setCartItems(cartItems.filter((item) => !selectedBooks.has(item.id)))
      setSelectedBooks(new Set())
      return
    }

    const user = getAuth().currentUser
    if (!user) return

    try {
      for (const item of cartItems) {
        if (!selectedBooks.has(item.id)) continue

        const bookRef = doc(db, "books", item.id)
        const bookSnap = await getDoc(bookRef)
        const stock = bookSnap.data()?.stock ?? 0
        if (stock <= 0) continue

        const now = new Date()
        const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

        await addDoc(collection(db, "borrowings"), {
          userId: user.uid,
          bookId: item.id,
          borrowDate: Timestamp.fromDate(now),
          returnDueDate: Timestamp.fromDate(dueDate),
          isReturned: false,
          returnedAt: null,
          daysLate: 0,
          damageCount: 0,
          damageNote: "",
          fine: 0,
        })

        await updateDoc(bookRef, { stock: stock - 1 })
        await deleteDoc(doc(db, "cart", user.uid, "items", item.id))
      }

      alert("Peminjaman berhasil.")
      setSelectedBooks(new Set())
    } catch (error) {
      console.error("Error borrowing books:", error)
      alert("Terjadi kesalahan saat meminjam buku.")
    }
  }

  const selectAll = () => {
    if (selectedBooks.size === cartItems.length) {
      // If all are selected, deselect all
      setSelectedBooks(new Set())
    } else {
      // Otherwise, select all
      setSelectedBooks(new Set(cartItems.map((item) => item.id)))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              aria-label="Back"
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Keranjang</h1>
          </div>
          <div className="bg-gold-100 text-gold-500 px-3 py-1 rounded-full text-sm font-medium">
            {cartItems.length} item
          </div>
        </div>

        {demoMode && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
            <p className="font-medium">Demo Mode Active</p>
            <p className="text-sm mt-1">Firebase is not configured. The app is running with sample cart data.</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-400"></div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-800 mb-2">Keranjang kosong</h3>
            <p className="text-gray-600 mb-6">Tambahkan buku ke keranjang untuk meminjamnya</p>
            <button
              onClick={() => router.push("/home")}
              className="px-4 py-2 bg-gold-400 text-white rounded-lg hover:bg-gold-500 transition-colors"
            >
              Cari Buku
            </button>
          </div>
        ) : (
          <>
            {/* Select All */}
            <div className="flex items-center justify-between bg-white rounded-lg p-4 mb-4 shadow-sm">
              <div className="flex items-center">
                <button
                  onClick={selectAll}
                  className={`w-5 h-5 rounded flex items-center justify-center mr-3 ${
                    selectedBooks.size === cartItems.length ? "bg-gold-400 text-white" : "border border-gray-300"
                  }`}
                >
                  {selectedBooks.size === cartItems.length && <Check className="h-4 w-4" />}
                </button>
                <span className="text-gray-700 font-medium">Pilih Semua</span>
              </div>
              <span className="text-sm text-gray-500">
                {selectedBooks.size} dari {cartItems.length} dipilih
              </span>
            </div>

            {/* Cart Items */}
            <div className="space-y-4 mb-24">
              {cartItems.map(({ id, data }) => {
                const isOutOfStock = (data.stock || 0) <= 0

                return (
                  <div
                    key={id}
                    className={`bg-white rounded-xl shadow-sm overflow-hidden flex ${isOutOfStock ? "opacity-70" : ""}`}
                  >
                    {/* Checkbox */}
                    <div className="p-4 flex items-center">
                      <button
                        onClick={() => toggleSelected(id)}
                        className={`w-5 h-5 rounded flex items-center justify-center ${
                          isOutOfStock
                            ? "bg-gray-200 cursor-not-allowed"
                            : selectedBooks.has(id)
                              ? "bg-gold-400 text-white"
                              : "border border-gray-300"
                        }`}
                        disabled={isOutOfStock}
                      >
                        {selectedBooks.has(id) && <Check className="h-3 w-3" />}
                      </button>
                    </div>

                    {/* Book Cover */}
                    <div className="w-[80px] h-[120px] flex-shrink-0 overflow-hidden">
                      {data.coverUrl?.startsWith("http") || data.coverUrl?.startsWith("/") ? (
                        <img
                          src={data.coverUrl || "/placeholder.svg?height=120&width=80"}
                          alt={data.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).onerror = null
                            ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=120&width=80"
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex justify-center items-center bg-gray-100">
                          <BookOpen className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Book Details */}
                    <div className="p-4 flex-grow flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-gray-800">{data.title || "Judul tidak tersedia"}</h3>
                        <p className="text-gray-600 text-sm">{data.author || "Penulis tidak tersedia"}</p>

                        {isOutOfStock ? (
                          <div className="flex items-center mt-2 text-red-600 text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            <span>Stok habis</span>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 mt-2">Stok: {data.stock || 0}</p>
                        )}
                      </div>
                    </div>

                    {/* Delete Button */}
                    <div className="p-4 flex items-center">
                      <button
                        onClick={() => handleDelete(id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Bottom Bar */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={borrowSelectedBooks}
              disabled={selectedBooks.size === 0}
              className={`w-full py-3 rounded-lg font-medium text-white ${
                selectedBooks.size === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gold-400 hover:bg-gold-500 transition-colors"
              }`}
            >
              Pinjam {selectedBooks.size} Buku
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
