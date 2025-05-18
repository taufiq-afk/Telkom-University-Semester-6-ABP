"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  collection,
  addDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import Image from "next/image"
import { ArrowLeft, BookOpen, ShoppingCart, BookMarked, AlertCircle } from "lucide-react"
import Navbar from "@/components/navbar"
import type { Book } from "@/models/book"

interface BookDetailProps {
  book: Book
}

export default function BookDetail({ book }: BookDetailProps) {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [isBookBorrowed, setIsBookBorrowed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const checkBorrowed = async () => {
      if (!userId) return

      const q = query(
        collection(db, "borrowings"),
        where("userId", "==", userId),
        where("bookId", "==", book.id),
        where("isReturned", "==", false),
      )
      const snapshot = await getDocs(q)
      setIsBookBorrowed(!snapshot.empty)
    }

    checkBorrowed()
  }, [userId, book.id])

  const handleAddToCart = async () => {
    if (!userId) {
      setMessage({ type: "error", text: "Silakan login terlebih dahulu" })
      setTimeout(() => router.push("/login"), 2000)
      return
    }

    setAddingToCart(true)
    setMessage(null)

    try {
      const cartItemRef = doc(db, "cart", userId, "items", book.id)

      await setDoc(cartItemRef, {
        bookId: book.id,
        title: book.title,
        author: book.author,
        coverUrl: book.coverUrl,
        quantity: 1,
        addedAt: Timestamp.now(),
      })

      setMessage({ type: "success", text: "Buku berhasil ditambahkan ke Cart" })
    } catch (error) {
      console.error("Error menambah ke cart:", error)
      setMessage({ type: "error", text: "Gagal menambah buku ke Cart" })
    } finally {
      setAddingToCart(false)
    }
  }

  const handleBorrowBook = async () => {
    if (!userId) {
      setMessage({ type: "error", text: "Silakan login terlebih dahulu" })
      setTimeout(() => router.push("/login"), 2000)
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const bookRef = doc(db, "books", book.id)
      const bookSnapshot = await getDoc(bookRef)
      const stock = bookSnapshot.data()?.stock ?? 0

      if (stock <= 0) {
        setMessage({ type: "error", text: `Stok habis untuk buku: ${book.title}` })
        return
      }

      const now = new Date()
      const dueDate = new Date()
      dueDate.setDate(now.getDate() + 7)

      await addDoc(collection(db, "borrowings"), {
        userId,
        bookId: book.id,
        title: book.title || "",
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
      setMessage({ type: "success", text: "Buku berhasil dipinjam!" })
      setIsBookBorrowed(true)
    } catch (error) {
      console.error("Error meminjam buku:", error)
      setMessage({ type: "error", text: "Gagal meminjam buku" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gold-500 hover:text-gold-600 transition-colors mb-8"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          <span className="font-medium">Kembali</span>
        </button>

        {/* Message Alert */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center ${
              message.type === "success" ? "bg-gold-100 text-gold-500" : "bg-red-50 text-red-700"
            }`}
          >
            {message.type === "success" ? (
              <BookMarked className="h-5 w-5 mr-2 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            )}
            <p>{message.text}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="md:flex">
            {/* Book Cover */}
            <div className="md:w-1/3 p-6 flex justify-center">
              <div className="relative w-[200px] h-[300px] overflow-hidden rounded-lg shadow-md">
                {book.coverUrl?.startsWith("http") ? (
                  <Image
                    src={book.coverUrl || "/placeholder.svg"}
                    alt={book.title}
                    fill
                    sizes="200px"
                    className="object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).onerror = null
                      ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=300&width=200"
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Book Details */}
            <div className="md:w-2/3 p-6 md:p-8">
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{book.title}</h1>
                <h2 className="text-xl text-gray-600 mb-4">{book.author}</h2>

                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gold-100 text-gold-500">
                    {book.category}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      book.stock > 0 ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    Stok: {book.stock}
                  </span>
                </div>

                <div className="prose max-w-none">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Deskripsi</h3>
                  <p className="text-gray-700">{book.description || "Tidak ada deskripsi tersedia."}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="flex-1 flex items-center justify-center gap-2 bg-white border border-gold-400 text-gold-500 hover:bg-gold-50 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {addingToCart ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gold-400"></div>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5" />
                      Tambah ke Cart
                    </>
                  )}
                </button>
                <button
                  onClick={handleBorrowBook}
                  disabled={isBookBorrowed || book.stock === 0 || loading}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                    isBookBorrowed || book.stock === 0
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-gold-400 text-white hover:bg-gold-500"
                  }`}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : isBookBorrowed ? (
                    <>
                      <BookMarked className="h-5 w-5" />
                      Sudah Dipinjam
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-5 w-5" />
                      Pinjam Buku
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
