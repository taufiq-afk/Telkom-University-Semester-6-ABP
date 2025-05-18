"use client"
import { useEffect, useState } from "react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import Navbar from "@/components/navbar"
import { Search, BookOpen, ChevronRight } from "lucide-react"

// Sample data for development/preview when Firebase is not available
const sampleBooks = [
  {
    id: "1",
    title: "The Psychology of Money",
    author: "Morgan Housel",
    category: "Finance",
    stock: 5,
    coverUrl: "/placeholder.svg?height=300&width=200",
    description: "Timeless lessons on wealth, greed, and happiness.",
  },
  {
    id: "2",
    title: "Atomic Habits",
    author: "James Clear",
    category: "Productivity",
    stock: 3,
    coverUrl: "/placeholder.svg?height=300&width=200",
    description: "An easy & proven way to build good habits & break bad ones.",
  },
  {
    id: "3",
    title: "Deep Work",
    author: "Cal Newport",
    category: "Productivity",
    stock: 2,
    coverUrl: "/placeholder.svg?height=300&width=200",
    description: "Rules for focused success in a distracted world.",
  },
  {
    id: "4",
    title: "Sapiens",
    author: "Yuval Noah Harari",
    category: "History",
    stock: 7,
    coverUrl: "/placeholder.svg?height=300&width=200",
    description: "A brief history of humankind.",
  },
  {
    id: "5",
    title: "The Lean Startup",
    author: "Eric Ries",
    category: "Business",
    stock: 4,
    coverUrl: "/placeholder.svg?height=300&width=200",
    description: "How today's entrepreneurs use continuous innovation.",
  },
  {
    id: "6",
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    category: "Psychology",
    stock: 6,
    coverUrl: "/placeholder.svg?height=300&width=200",
    description: "How we think and make choices.",
  },
]

const categories = [
  "Semua",
  "Productivity",
  "Finance",
  "Psychology",
  "History",
  "Technology",
  "Business",
  "Science",
  "Biography",
  "Self-help",
  "Economics",
]

export default function HomeScreen() {
  const router = useRouter()

  const [selectedCategory, setSelectedCategory] = useState("Semua")
  const [searchQuery, setSearchQuery] = useState("")
  const [personalizedCategory, setPersonalizedCategory] = useState<string | null>(null)
  const [recommendedBooks, setRecommendedBooks] = useState<any[]>([])
  const [allBooks, setAllBooks] = useState<any[]>([])
  const [isFirebaseAvailable, setIsFirebaseAvailable] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    setPersonalizedCategory("Productivity")
  }, [])

  useEffect(() => {
    try {
      const booksRef = collection(db, "books")

      // Check if Firebase is properly initialized
      if (!booksRef || isDemoMode) {
        setIsFirebaseAvailable(false)
        setAllBooks(sampleBooks)
        return () => {}
      }

      const unsubscribe = onSnapshot(
        booksRef,
        (snapshot) => {
          setAllBooks(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
        },
        (error) => {
          console.error("Firebase error:", error)
          setIsFirebaseAvailable(false)
          setAllBooks(sampleBooks)
        },
      )

      return () => unsubscribe()
    } catch (error) {
      console.error("Firebase error:", error)
      setIsFirebaseAvailable(false)
      setAllBooks(sampleBooks)
      return () => {}
    }
  }, [])

  useEffect(() => {
    try {
      if (!isFirebaseAvailable) {
        // Filter sample books based on the personalized category
        const filteredBooks = personalizedCategory
          ? sampleBooks.filter((book) => book.category === personalizedCategory)
          : sampleBooks.filter((book) => ["Productivity", "Finance"].includes(book.category))

        setRecommendedBooks(filteredBooks)
        return () => {}
      }

      const booksRef = collection(db, "books")
      const q = personalizedCategory
        ? query(booksRef, where("category", "==", personalizedCategory))
        : query(booksRef, where("category", "in", ["Productivity", "Finance"]))

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          setRecommendedBooks(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
        },
        (error) => {
          console.error("Firebase error:", error)
          // Filter sample books based on the personalized category
          const filteredBooks = personalizedCategory
            ? sampleBooks.filter((book) => book.category === personalizedCategory)
            : sampleBooks.filter((book) => ["Productivity", "Finance"].includes(book.category))

          setRecommendedBooks(filteredBooks)
        },
      )

      return () => unsubscribe()
    } catch (error) {
      console.error("Firebase error:", error)
      // Filter sample books based on the personalized category
      const filteredBooks = personalizedCategory
        ? sampleBooks.filter((book) => book.category === personalizedCategory)
        : sampleBooks.filter((book) => ["Productivity", "Finance"].includes(book.category))

      setRecommendedBooks(filteredBooks)
      return () => {}
    }
  }, [personalizedCategory, isFirebaseAvailable])

  const filteredBooks = allBooks.filter((book) => {
    const title = book.title?.toLowerCase() || ""
    const author = book.author?.toLowerCase() || ""
    const category = book.category || "Uncategorized"
    const matchesSearch = title.includes(searchQuery.toLowerCase()) || author.includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "Semua" || category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header with welcome message */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Selamat Datang</h1>
          <p className="text-gray-600">Temukan buku favorit Anda hari ini</p>
        </div>

        {!isFirebaseAvailable && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
            <p className="font-medium">Demo Mode: Using sample data because Firebase is not configured.</p>
            <p className="text-sm mt-1">Add your Firebase environment variables to connect to a real database.</p>
          </div>
        )}

        {/* Search Input */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Cari buku berdasarkan judul atau penulis..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition-colors bg-white font-medium text-gray-900"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ fontWeight: 500, color: "#000000" }}
          />
        </div>

        {/* Category Pills */}
        <div className="mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-gold-400 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Recommended Section */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Rekomendasi Untukmu</h2>
            <button className="text-gold-500 text-sm font-medium flex items-center hover:underline">
              Lihat Semua <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {recommendedBooks.length > 0 ? (
              recommendedBooks.map((book) => (
                <div
                  key={book.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => router.push(`/books/${book.id}`)}
                >
                  <div className="aspect-[2/3] relative overflow-hidden">
                    {book.coverUrl?.startsWith("http") || book.coverUrl?.startsWith("/") ? (
                      <img
                        src={book.coverUrl || "/placeholder.svg?height=300&width=200"}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex justify-center items-center bg-gray-100">
                        <BookOpen className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-gray-800 line-clamp-1">{book.title}</p>
                    <p className="text-sm text-gray-600 line-clamp-1">{book.author}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500 py-8">Tidak ada rekomendasi saat ini</p>
            )}
          </div>
        </section>

        {/* Filtered Book List */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Semua Buku</h2>

          {filteredBooks.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Tidak ditemukan buku yang sesuai.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  className="flex bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/books/${book.id}`)}
                >
                  <div className="w-[100px] h-[150px] flex-shrink-0 overflow-hidden">
                    {book.coverUrl?.startsWith("http") || book.coverUrl?.startsWith("/") ? (
                      <img
                        src={book.coverUrl || "/placeholder.svg?height=150&width=100"}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex justify-center items-center bg-gray-100">
                        <BookOpen className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col justify-between flex-grow">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg mb-1">{book.title}</h3>
                      <p className="text-gray-700">{book.author}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gold-100 text-gold-500">
                        {book.category || "Uncategorized"}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Stok: {book.stock || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
