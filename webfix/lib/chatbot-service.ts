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
  {
    id: "6",
    title: "Ikigai",
    author: "Héctor García and Francesc Miralles",
    category: "Self-Help",
    stock: 6,
    description: "The Japanese secret to a long and happy life.",
  },
]

// Library rules (aturan perpustakaan)
const libraryRules = [
  {
    keywords: ["makanan", "makan", "bawa makanan", "boleh makan"],
    answer: "Tidak, Anda tidak diperbolehkan membawa atau mengonsumsi makanan di dalam perpustakaan demi menjaga kebersihan dan kenyamanan bersama."
  },
  {
    keywords: ["hewan", "bawa hewan", "binatang", "boleh bawa hewan"],
    answer: "Tidak, membawa hewan ke dalam perpustakaan tidak diperbolehkan kecuali hewan penuntun untuk kebutuhan khusus."
  },
  {
    keywords: ["berisik", "suara", "ribut", "bercakap keras", "boleh berisik"],
    answer: "Tidak, pengunjung tidak diperbolehkan berisik di dalam perpustakaan. Harap menjaga ketenangan agar semua pengunjung dapat belajar dan membaca dengan nyaman."
  },
  {
    keywords: ["peminjaman", "pinjam buku", "cara pinjam", "aturan pinjam", "prosedur pinjam"],
    answer: "Peminjaman buku dilakukan dengan menunjukkan kartu anggota. Buku harus dikembalikan tepat waktu dan dalam kondisi baik (tidak rusak atau hilang). Jika terlambat atau rusak, akan dikenakan denda sesuai kebijakan perpustakaan."
  },
  {
    keywords: ["kebersihan", "sampah", "buang sampah"],
    answer: "Pengunjung wajib menjaga kebersihan perpustakaan dan membuang sampah pada tempatnya."
  },
  {
    keywords: ["merokok", "rokok", "asap rokok"],
    answer: "Dilarang merokok di seluruh area perpustakaan."
  },
  {
    keywords: ["aturan", "peraturan", "tata tertib", "rule", "rules", "regulation"],
    answer: "Beberapa aturan utama perpustakaan: tidak boleh membawa makanan/minuman, tidak boleh membawa hewan, tidak boleh berisik, wajib menjaga kebersihan, dan harus mengembalikan buku tepat waktu. Untuk detail lebih lanjut, silakan tanyakan aturan spesifik yang ingin Anda ketahui."
  },
  {
    keywords: ["denda", "terlambat", "telat", "keterlambatan"],
    answer: "Jika Anda terlambat mengembalikan buku, akan dikenakan denda sesuai kebijakan perpustakaan."
  },
  {
    keywords: ["kerusakan", "buku rusak", "buku hilang"],
    answer: "Buku yang dipinjam harus dijaga dengan baik. Jika buku rusak atau hilang, peminjam wajib mengganti atau membayar sesuai ketentuan perpustakaan."
  }
];

// Function to get book information from Firebase or sample data
async function getBookInfo(bookTitle?: string) {
  try {
    const booksRef = collection(db, "books");
    let booksQuery: any = booksRef;

    if (bookTitle) {
      // This is a simplified query - in a real app, you might want to use
      // a more sophisticated search method or a dedicated search service
      booksQuery = query(
        booksRef, 
        where("title", ">=", bookTitle.toLowerCase()), 
        where("title", "<=", bookTitle.toLowerCase() + "\uf8ff")
      );
    }

    const snapshot = await getDocs(booksQuery);

    if (snapshot.empty) {
      // Fall back to sample data if no books found in Firebase
      if (isDemoMode) {
        if (!bookTitle) {
          return sampleBooks;
        }
        const filteredBooks = sampleBooks.filter((book) => 
          book.title.toLowerCase().includes(bookTitle.toLowerCase())
        );
        return filteredBooks.length > 0 ? filteredBooks : "No books found with that title.";
      }
      return "No books found with that title.";
    }

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data() as Record<string, any>
    }));
  } catch (error) {
    console.error("Error fetching book info:", error);
    
    // In case of error, fall back to sample data
    if (isDemoMode) {
      if (!bookTitle) {
        return sampleBooks;
      }
      const filteredBooks = sampleBooks.filter((book) => 
        book.title.toLowerCase().includes(bookTitle.toLowerCase())
      );
      return filteredBooks.length > 0 ? filteredBooks : "No books found with that title.";
    }
    
    return "Sorry, I couldn't fetch book information at the moment.";
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
  const query = userMessage.toLowerCase().trim();

  // Cek aturan perpustakaan (library rules)
  for (const rule of libraryRules) {
    for (const keyword of rule.keywords) {
      if (query.includes(keyword)) {
        return rule.answer;
      }
    }
  }

  // Perbaiki pencarian stok buku: partial & case-insensitive
  if ((query.includes('stok') && query.includes('buku')) && contextInfo.allBooks) {
    const books = contextInfo.allBooks;
    // Ambil judul dari pertanyaan, misal: stok buku ikigai
    const match = query.match(/stok\s+buku\s+(.+)/i);
    if (match) {
      const searchTitle = match[1].trim().toLowerCase();
      const foundBooks = books.filter((b: any) =>
        b.title && b.title.toLowerCase().includes(searchTitle)
      );
      if (foundBooks.length === 1) {
        const book = foundBooks[0];
        return `Stok buku "${book.title}" oleh ${book.author}: ${book.stock}`;
      } else if (foundBooks.length > 1) {
        return `Ada beberapa buku yang mirip: ${foundBooks.map((b: any) => `"${b.title}"`).join(', ')}. Mohon spesifikkan judulnya.`;
      } else {
        return `Buku dengan judul mengandung "${searchTitle}" tidak ditemukan.`;
      }
    }
  }

  // Handle direct stock queries with format "stock buku [title]"
  const directStockRegex = /^stock\s+buku\s+(.+)$/i;
  const directStockMatch = userMessage.match(directStockRegex);
  
  if (directStockMatch) {
    const bookTitle = directStockMatch[1].trim();
    // First check if we have specific book info already
    if (contextInfo.bookInfo) {
      const bookInfo = contextInfo.bookInfo;
      if (Array.isArray(bookInfo) && bookInfo.length > 0) {
        const book = bookInfo[0];
        return `"${book.title}" by ${book.author} has ${book.stock} ${book.stock === 1 ? "copy" : "copies"} available in stock.`;
      } else if (typeof bookInfo === "string") {
        return bookInfo;
      }
    }
    
    // If not, search through all books
    if (contextInfo.allBooks) {
      const allBooks = contextInfo.allBooks;
      if (Array.isArray(allBooks)) {
        const matchingBook = allBooks.find(book => 
          book.title.toLowerCase().includes(bookTitle.toLowerCase())
        );
        
        if (matchingBook) {
          return `"${matchingBook.title}" by ${matchingBook.author} has ${matchingBook.stock} ${matchingBook.stock === 1 ? "copy" : "copies"} available in stock.`;
        } else {
          return `I couldn't find any book titled "${bookTitle}" in our collection.`;
        }
      }
    }
  }

  // Indonesian language pattern detection
  const isIndonesian = query.includes('berapa') || 
                      query.includes('stok') || 
                      query.includes('buku') || 
                      query.includes('perpustakaan') ||
                      query.includes('jam buka') ||
                      query.includes('pinjam') ||
                      query.includes('kembali') ||
                      query.includes('denda') ||
                      /^(halo|hai|selamat (pagi|siang|sore|malam))[\s!.?]*$/i.test(query) ||
                      /^(terima kasih|makasih|thanks)[\s!.?]*$/i.test(query);
                      
  // Direct Indonesian query handling
  if (isIndonesian) {
    // Indonesian book stock query
    const stockRegex = /berapa(?:\s+(?:stok|jumlah))?\s+(?:buku)?\s+([^?.,]+)(?:\?)?/i;
    const stockMatch = query.match(stockRegex);
    
    if (stockMatch && contextInfo.allBooks) {
      const bookTitle = stockMatch[1].trim();
      const books = contextInfo.allBooks;
      
      if (Array.isArray(books)) {
        const matchingBook = books.find(book => 
          book.title.toLowerCase().includes(bookTitle.toLowerCase())
        );
        
        if (matchingBook) {
          return `"${matchingBook.title}" by ${matchingBook.author} has ${matchingBook.stock} ${matchingBook.stock === 1 ? "copy" : "copies"} available in stock.`;
        } else {
          return `I couldn't find any book titled "${bookTitle}" in our collection.`;
        }
      }
    }
    
    // Indonesian availability query
    if ((query.includes('berapa') || query.includes('stok') || query.includes('buku')) && contextInfo.allBooks) {
      const books = contextInfo.allBooks;
      if (Array.isArray(books) && books.length > 0) {
        const availableBooks = books.filter(b => b.stock > 0);
        const topAvailableBooks = availableBooks
          .sort((a, b) => b.stock - a.stock)
          .slice(0, 3);
        
        const bookList = topAvailableBooks
          .map((b) => `"${b.title}" by ${b.author} (${b.stock} in stock)`)
          .join(", ");
          
        return `We have ${availableBooks.length} books currently available for borrowing. Some options include: ${bookList}.`;
      }
    }
    
    // Indonesian greetings
    if (/^(halo|hai|selamat (pagi|siang|sore|malam))[\s!.?]*$/i.test(query)) {
      return "Halo! Bagaimana saya bisa membantu Anda dengan perpustakaan hari ini?";
    }
    
    // Indonesian thank you
    if (/^(terima kasih|makasih|thanks)[\s!.?]*$/i.test(query)) {
      return "Sama-sama! Beri tahu saya jika Anda membutuhkan bantuan lain.";
    }
    
    // Indonesian library hours
    if (query.includes('jam') && contextInfo.libraryInfo) {
      const info = contextInfo.libraryInfo;
      return `Perpustakaan buka pada ${info.openingHours}.`;
    }
    
    // Indonesian borrowing info
    if (query.includes('pinjam') && contextInfo.libraryInfo) {
      const info = contextInfo.libraryInfo;
      return `Anda dapat meminjam buku selama ${info.borrowingPeriod}. Jumlah maksimum buku yang dapat Anda pinjam sekaligus adalah ${info.maxBooksPerUser}.`;
    }
    
    // Indonesian late fee info
    if ((query.includes('denda') || query.includes('terlambat')) && contextInfo.libraryInfo) {
      const info = contextInfo.libraryInfo;
      return `Denda keterlambatan pengembalian adalah ${info.lateReturnFee}.`;
    }
    
    // Default Indonesian response
    return "Maaf, saya tidak sepenuhnya memahami pertanyaan Anda. Anda dapat bertanya tentang ketersediaan buku, jam perpustakaan, atau kebijakan peminjaman. Bisakah Anda mengajukan pertanyaan dengan cara lain?";
  }

  // Continue with existing English responses
  // Check for greetings (English and Indonesian)
  if (/^(hello|hi|hey|greetings|good (morning|afternoon|evening)|halo|hai|selamat (pagi|siang|sore|malam))[\s!.?]*$/i.test(query)) {
    return "Hello! How can I help you with the library today?";
  }

  // Check for thank you messages (English and Indonesian)
  if (/^(thank|thanks|thank you|thanks a lot|appreciate it|terima kasih|makasih|thanks)[\s!.?]*$/i.test(query)) {
    return "You're welcome! Let me know if you need anything else.";
  }
  
  // Extract book title from query more effectively
  const bookTitleRegex = /(?:book|find|search|looking for|about|buku)\s+(?:called|titled|named|")?([^"?.,]+)(?:")?/i;
  const bookTitleMatch = query.match(bookTitleRegex);
  const possibleBookTitle = bookTitleMatch ? bookTitleMatch[1].trim() : null;

  // Book searching logic
  if (possibleBookTitle && 
      (query.includes("book") || 
       query.includes("find") || 
       query.includes("search") || 
       query.includes("looking for"))) {
    // If we have specific book info from the context
    if (contextInfo.bookInfo) {
      const bookInfo = contextInfo.bookInfo;
      if (Array.isArray(bookInfo) && bookInfo.length > 0) {
        const book = bookInfo[0];
        return `I found "${book.title}" by ${book.author}. ${book.description} There are currently ${book.stock} copies available.`;
      } else if (typeof bookInfo === "string") {
        return bookInfo;
      }
    }
    // If we have all books info but no specific match was pre-loaded
    else if (contextInfo.allBooks) {
      const allBooks = contextInfo.allBooks;
      if (Array.isArray(allBooks)) {
        // Try to find matches in our full book list
        const matchingBooks = allBooks.filter(book => 
          book.title.toLowerCase().includes(possibleBookTitle.toLowerCase()) ||
          book.author.toLowerCase().includes(possibleBookTitle.toLowerCase())
        );
        
        if (matchingBooks.length > 0) {
          if (matchingBooks.length === 1) {
            const book = matchingBooks[0];
            return `I found "${book.title}" by ${book.author}. ${book.description} There are currently ${book.stock} copies available.`;
          } else {
            const bookListString = matchingBooks
              .slice(0, 3)
              .map(b => `"${b.title}" by ${b.author}`)
              .join(", ");
            const moreInfo = matchingBooks.length > 3 ? ` and ${matchingBooks.length - 3} more` : "";
            return `I found ${matchingBooks.length} books that might match your query: ${bookListString}${moreInfo}. Would you like more information about any of these books?`;
          }
        }
      }
    }
  }

  // Check for stock queries
  if (query.includes("stock") || query.includes("available") || query.includes("borrow")) {
    // Handle specific book stock queries
    if (contextInfo.bookInfo) {
      const bookInfo = contextInfo.bookInfo;
    if (Array.isArray(bookInfo) && bookInfo.length > 0) {
        const book = bookInfo[0];
        return `"${book.title}" by ${book.author} has ${book.stock} ${book.stock === 1 ? "copy" : "copies"} available in stock.`;
    } else if (typeof bookInfo === "string") {
        return bookInfo;
      }
    }
    // Handle general availability question
    else if (contextInfo.allBooks) {
      const books = contextInfo.allBooks;
      if (Array.isArray(books) && books.length > 0) {
        const availableBooks = books.filter(b => b.stock > 0);
        const topAvailableBooks = availableBooks
          .sort((a, b) => b.stock - a.stock)
          .slice(0, 3);
        
        const bookList = topAvailableBooks
          .map((b) => `"${b.title}" by ${b.author} (${b.stock} in stock)`)
          .join(", ");
          
        return `We have ${availableBooks.length} books currently available for borrowing. Some options include: ${bookList}. Is there a specific genre or author you're interested in?`;
      }
    }
  }
  
  // Handle category/genre queries
  if (query.includes("category") || query.includes("genre") || query.includes("categories") || query.includes("genres")) {
    if (contextInfo.allBooks) {
      const books = contextInfo.allBooks;
      if (Array.isArray(books) && books.length > 0) {
        const categories = [...new Set(books.map(b => b.category))];
        return `Our library has books in the following categories: ${categories.join(", ")}. Would you like recommendations from any specific category?`;
      }
    }
  }

  // Handle author queries
  if (query.includes("author") || query.includes("written by") || query.includes("books by")) {
    const authorNameMatch = query.match(/author\s+(?:named|called)?\s+([^?.,]+)/i) || 
                          query.match(/books\s+by\s+([^?.,]+)/i) || 
                          query.match(/written\s+by\s+([^?.,]+)/i);
    const authorName = authorNameMatch ? authorNameMatch[1].trim() : null;
    
    if (authorName && contextInfo.allBooks) {
      const books = contextInfo.allBooks;
      if (Array.isArray(books)) {
        const authorBooks = books.filter(b => 
          b.author.toLowerCase().includes(authorName.toLowerCase())
        );
        
        if (authorBooks.length > 0) {
          const bookList = authorBooks
            .map(b => `"${b.title}" (${b.stock} in stock)`)
            .join(", ");
          return `I found ${authorBooks.length} books by ${authorName}: ${bookList}.`;
        } else {
          return `I couldn't find any books by an author named "${authorName}" in our collection.`;
        }
      }
    }
  }

  // Check for general book recommendations
  if ((query.includes("recommend") || query.includes("suggestion") || query.includes("popular")) && contextInfo.allBooks) {
    const books = contextInfo.allBooks;
    if (Array.isArray(books) && books.length > 0) {
      const availableBooks = books.filter(b => b.stock > 0);
      const randomBooks = availableBooks
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      
      const bookList = randomBooks
        .map((b) => `"${b.title}" by ${b.author} (${b.category})`)
        .join(", ");
        
      return `Here are some book recommendations: ${bookList}. Would you like more suggestions or information about any of these books?`;
    }
  }

  // Library information queries
  if (contextInfo.libraryInfo) {
    const info = contextInfo.libraryInfo;

    // Hours query
    if (query.includes("hour") || query.includes("open") || query.includes("close") || query.includes("timing")) {
      return `The library is open ${info.openingHours}.`;
    }

    // Borrowing policy queries
    if (query.includes("borrow") || query.includes("loan") || query.includes("take out")) {
      return `You can borrow books for ${info.borrowingPeriod}. The maximum number of books you can borrow at once is ${info.maxBooksPerUser}.`;
    }

    // Late return and fee queries
    if (query.includes("fee") || query.includes("fine") || query.includes("late") || query.includes("overdue") || query.includes("return")) {
      return `The late return fee is ${info.lateReturnFee}.`;
    }

    // General library info
    if (query.includes("library") || query.includes("about")) {
      return `${info.name} is open ${info.openingHours}. You can borrow up to ${info.maxBooksPerUser} books for ${info.borrowingPeriod}, with a late fee of ${info.lateReturnFee}.`;
    }
  }

  // Help query
  if (query.includes("help") || query.includes("what can you do") || query.includes("how to use")) {
    return "I can help you with several library-related tasks:\n\n" +
           "• Find books by title, author, or category\n" +
           "• Check book availability\n" +
           "• Provide book recommendations\n" +
           "• Share information about borrowing policies\n" +
           "• Tell you about library hours\n" +
           "• Answer questions about late fees and returns\n\n" +
           "What can I help you with today?";
  }

  // Default fallback response
  return "I'm not sure I understand your question completely. You can ask me about finding specific books, checking availability, library hours, or borrowing policies. Could you rephrase your question?";
}

export async function getChatbotResponse(userMessage: string) {
  try {
    // Handle direct stock query format "stock buku [title]"
    const directStockRegex = /^stock\s+buku\s+(.+)$/i;
    const directStockMatch = userMessage.match(directStockRegex);
    
    if (directStockMatch) {
      const bookTitle = directStockMatch[1].trim();
      const bookInfo = await getBookInfo(bookTitle);
      const allBooks = await getBookInfo();
      
      return await generateLocalResponse(userMessage, { 
        bookInfo,
        allBooks,
        libraryInfo: getLibraryInfo()
      });
    }
    
    // Check if the query is in Indonesian
    const query = userMessage.toLowerCase();
    const isIndonesian = query.includes('berapa') || 
                        query.includes('stok') || 
                        query.includes('buku') || 
                        query.includes('perpustakaan') ||
                        query.includes('jam buka') ||
                        query.includes('pinjam') ||
                        query.includes('kembali') ||
                        query.includes('denda') ||
                        /^(halo|hai|selamat (pagi|siang|sore|malam))[\s!.?]*$/i.test(query) ||
                        /^(terima kasih|makasih|thanks)[\s!.?]*$/i.test(query);
    
    let bookTitle;
    
    // Handle Indonesian book title extraction first if it's an Indonesian query
    if (isIndonesian) {
      const stockRegex = /berapa(?:\s+(?:stok|jumlah))?\s+(?:buku)?\s+([^?.,]+)(?:\?)?/i;
      const stockMatch = query.match(stockRegex);
      
      if (stockMatch) {
        bookTitle = stockMatch[1].trim();
      }
      
      // For Indonesian queries, always load all books to provide better context
      const contextInfo: any = { 
        allBooks: await getBookInfo(),
        libraryInfo: getLibraryInfo()
      };
      
      // If we have a specific book title extracted, add book info
      if (bookTitle) {
        const bookInfo = await getBookInfo(bookTitle);
        contextInfo.bookInfo = bookInfo;
      }
      
      return await generateLocalResponse(userMessage, contextInfo);
    }
    
    // Continue with existing English processing
    // Extract potential book title from user message using multiple patterns
    
    // Pattern 1: Direct "find book X" or "looking for X" type queries
    const bookTitleRegex = /(?:book|find|search|looking for|about|buku)\s+(?:called|titled|named|")?([^"?.,]+)(?:")?/i;
    const bookTitleMatch = userMessage.match(bookTitleRegex);
    
    // Pattern 2: Stock of "X" or availability of "X" patterns
    const stockTitleRegex = /stock(?:\s+of)?\s+"([^"]+)"|stock(?:\s+of)?\s+([^?.,]+)|availability(?:\s+of)?\s+"([^"]+)"|availability(?:\s+of)?\s+([^?.,]+)/i;
    const stockTitleMatch = userMessage.match(stockTitleRegex);
    
    // Pattern 3: Indonesian stock query "berapa stok buku X"
    const indonesianStockRegex = /berapa\s+(?:stok|jumlah)\s+(?:buku)?\s+(.+)/i;
    const indonesianMatch = userMessage.match(indonesianStockRegex);
    
    // Pattern 4: Author queries like "books by X" or "author X"
    const authorRegex1 = /author\s+(?:named|called)?\s+([^?.,]+)/i;
    const authorRegex2 = /books\s+by\s+([^?.,]+)/i;
    const authorRegex3 = /written\s+by\s+([^?.,]+)/i;
    const authorNameMatch = userMessage.match(authorRegex1) || userMessage.match(authorRegex2) || userMessage.match(authorRegex3);
    
    // Use the first match found in order of priority
    if (bookTitleMatch) {
      bookTitle = bookTitleMatch[1].trim();
    } else if (stockTitleMatch) {
      bookTitle = (stockTitleMatch[1] || stockTitleMatch[2] || stockTitleMatch[3] || stockTitleMatch[4]).trim();
    } else if (indonesianMatch) {
      bookTitle = indonesianMatch[1].trim();
    }

    let contextInfo = {};

    // Add book info to context if we have a title or it's a book-related query
    if (bookTitle) {
      contextInfo = { bookInfo: await getBookInfo(bookTitle) };
    } 
    // Handle category/genre queries
    else if (query.includes("category") || query.includes("genre") || 
             query.includes("recommendation") || query.includes("suggest") ||
             query.includes("book") || query.includes("read") || 
             query.includes("author") || query.includes("written by") ||
             query.includes("stock") || query.includes("available") ||
             query.includes("berapa") || query.includes("stok") || 
             query.includes("buku")) {
      contextInfo = { allBooks: await getBookInfo() };
    }
    
    // Always add library info for any library-related terms
    if (query.includes("library") || query.includes("hour") ||
        query.includes("open") || query.includes("close") ||
        query.includes("borrow") || query.includes("loan") ||
        query.includes("return") || query.includes("fee") ||
        query.includes("fine") || query.includes("policy") ||
        query.includes("rule") || query.includes("help") ||
        query.includes("perpustakaan") || query.includes("jam")) {
      contextInfo = { ...contextInfo, libraryInfo: getLibraryInfo() };
    }

    // If we have an author query specifically, add that to context
    if (authorNameMatch) {
      const authorName = authorNameMatch[1].trim();
      contextInfo = { 
        ...contextInfo, 
        authorQuery: authorName,
        allBooks: await getBookInfo() // Make sure we have all books for author filtering
      };
    }

    // Use local response generator
    return await generateLocalResponse(userMessage, contextInfo);
  } catch (error) {
    console.error("Error generating chatbot response:", error);
    return "I'm sorry, I encountered an error while processing your request. Please try again later.";
  }
}
