import { collection, getDocs, query, where } from "firebase/firestore"
import { db, isDemoMode } from "@/lib/firebase"

// Sample books data for demo mode
const sampleBooks = [
  {
    id: "1",
    title: "The Psychology of Money",
    author: "Morgan Housel",
    category: "Finance",
    stock: 5,
    description: "Timeless lessons on wealth, greed, and happiness.",
  },
  {
    id: "2",
    title: "Atomic Habits",
    author: "James Clear",
    category: "Productivity",
    stock: 3,
    description: "An easy & proven way to build good habits & break bad ones.",
  },
  {
    id: "3",
    title: "Deep Work",
    author: "Cal Newport",
    category: "Productivity",
    stock: 2,
    description: "Rules for focused success in a distracted world.",
  },
  {
    id: "4",
    title: "Sapiens",
    author: "Yuval Noah Harari",
    category: "History",
    stock: 7,
    description: "A brief history of humankind.",
  },
  {
    id: "5",
    title: "The Lean Startup",
    author: "Eric Ries",
    category: "Business",
    stock: 4,
    description: "How today's entrepreneurs use continuous innovation.",
  },
]

// Function to get book information from Firebase or sample data
async function getBookInfo(bookTitle?: string) {
  try {
    if (isDemoMode) {
      if (!bookTitle) {
        return sampleBooks
      }

      const filteredBooks = sampleBooks.filter((book) => book.title.toLowerCase().includes(bookTitle.toLowerCase()))

      return filteredBooks.length > 0 ? filteredBooks : "No books found with that title."
    }

    const booksRef = collection(db, "books")
    let booksQuery = booksRef

    if (bookTitle) {
      // This is a simplified query - in a real app, you might want to use
      // a more sophisticated search method or a dedicated search service
      booksQuery = query(booksRef, where("title", ">=", bookTitle), where("title", "<=", bookTitle + "\uf8ff"))
    }

    const snapshot = await getDocs(booksQuery)

    if (snapshot.empty) {
      return "No books found with that title."
    }

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error fetching book info:", error)
    return "Sorry, I couldn't fetch book information at the moment."
  }
}

// Function to get library information
function getLibraryInfo() {
  return {
    name: "Library App",
    openingHours: "Monday to Friday: 9:00 AM - 8:00 PM, Saturday and Sunday: 10:00 AM - 6:00 PM",
    borrowingPeriod: "7 days",
    maxBooksPerUser: 5,
    lateReturnFee: "$0.50 per day",
  }
}

// Simple rule-based response generator (no external API needed)
async function generateLocalResponse(userMessage: string, contextInfo: any) {
  const query = userMessage.toLowerCase()

  // Check for book stock queries
  if (query.includes("stock") && contextInfo.bookInfo) {
    const bookInfo = contextInfo.bookInfo

    if (Array.isArray(bookInfo) && bookInfo.length > 0) {
      const book = bookInfo[0]
      return `"${book.title}" by ${book.author} has ${book.stock} copies available in stock.`
    } else if (typeof bookInfo === "string") {
      return bookInfo
    }
  }

  // Check for general book queries
  if ((query.includes("book") || query.includes("recommend")) && contextInfo.allBooks) {
    const books = contextInfo.allBooks

    if (Array.isArray(books) && books.length > 0) {
      const bookList = books
        .slice(0, 3)
        .map((b) => `"${b.title}" by ${b.author} (${b.stock} in stock)`)
        .join(", ")
      return `Here are some books in our collection: ${bookList}. We have ${books.length} books in total.`
    }
  }

  // Check for library information queries
  if (contextInfo.libraryInfo) {
    const info = contextInfo.libraryInfo

    if (query.includes("hour") || query.includes("open")) {
      return `The library is open ${info.openingHours}.`
    }

    if (query.includes("borrow") || query.includes("long")) {
      return `You can borrow books for ${info.borrowingPeriod}. The maximum number of books you can borrow at once is ${info.maxBooksPerUser}.`
    }

    if (query.includes("fee") || query.includes("late") || query.includes("return")) {
      return `The late return fee is ${info.lateReturnFee}.`
    }
  }

  // Default responses for common queries
  if (query.includes("hello") || query.includes("hi ")) {
    return "Hello! How can I help you with the library today?"
  }

  if (query.includes("thank")) {
    return "You're welcome! Let me know if you need anything else."
  }

  if (query.includes("help")) {
    return "I can help you find books, check stock availability, provide information about borrowing policies, and answer questions about the library. What would you like to know?"
  }

  // Default fallback response
  return "I'm not sure I understand your question. You can ask me about book availability, library hours, or borrowing policies."
}

export async function getChatbotResponse(userMessage: string) {
  try {
    // Extract potential book title from user message
    const bookTitleMatch = userMessage.match(/stock(?:\s+of)?\s+"([^"]+)"|stock(?:\s+of)?\s+([^?.,]+)/i)
    const bookTitle = bookTitleMatch ? (bookTitleMatch[1] || bookTitleMatch[2]).trim() : undefined

    // Get relevant information based on the user's query
    let contextInfo = {}

    if (userMessage.toLowerCase().includes("stock") && bookTitle) {
      contextInfo = { bookInfo: await getBookInfo(bookTitle) }
    } else if (userMessage.toLowerCase().includes("book") || userMessage.toLowerCase().includes("stock")) {
      contextInfo = { allBooks: await getBookInfo() }
    } else if (
      userMessage.toLowerCase().includes("library") ||
      userMessage.toLowerCase().includes("hour") ||
      userMessage.toLowerCase().includes("open") ||
      userMessage.toLowerCase().includes("borrow") ||
      userMessage.toLowerCase().includes("return") ||
      userMessage.toLowerCase().includes("fee")
    ) {
      contextInfo = { libraryInfo: getLibraryInfo() }
    }

    // Use local response generator instead of OpenAI
    return await generateLocalResponse(userMessage, contextInfo)
  } catch (error) {
    console.error("Error generating chatbot response:", error)
    return "I'm sorry, I encountered an error while processing your request. Please try again later."
  }
}
