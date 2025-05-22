import BookDetail from "@/components/book-detail"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { BookOpen } from "lucide-react"

interface BookDetailPageProps {
  params: {
    id: string
  }
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  let bookData

  try {
    const docRef = doc(db, "books", params.id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      bookData = { id: docSnap.id, ...docSnap.data() }
    }
  } catch (error) {
    console.error("Error fetching book:", error)
    // Use sample data for preview/development
    bookData = {
      id: params.id,
      title: "Sample Book",
      author: "Sample Author",
      description: "This is a sample book description for development and preview purposes.",
      category: "Sample Category",
      stock: 5,
      coverUrl: "/placeholder.svg?height=300&width=200",
    }
  }

  if (!bookData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm p-12 text-center max-w-md">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Buku tidak ditemukan</h2>
          <p className="text-gray-600 mb-6">Buku yang Anda cari tidak tersedia atau telah dihapus</p>
          <a
            href="/home"
            className="inline-block px-4 py-2 bg-gold-400 text-white rounded-lg hover:bg-gold-500 transition-colors"
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>
    )
  }

  return <BookDetail book={bookData as any} />
}
