import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class BookDetailScreen extends StatefulWidget {
  final String bookId;
  final Map<String, dynamic> bookData;

  const BookDetailScreen({super.key, required this.bookId, required this.bookData});

  @override
  _BookDetailScreenState createState() => _BookDetailScreenState();
}

class _BookDetailScreenState extends State<BookDetailScreen> {
  @override
  Widget build(BuildContext context) {
    final title = widget.bookData['title'] ?? 'Judul tidak tersedia';
    final author = widget.bookData['author'] ?? 'Penulis tidak diketahui';
    final coverUrl = widget.bookData['coverUrl'];
    final description = widget.bookData['description'] ?? 'Tidak ada deskripsi.';
    final category = widget.bookData['category'] ?? 'Uncategorized';
    final stock = widget.bookData['stock'] ?? 0;

    final userId = FirebaseAuth.instance.currentUser?.uid;

    return Scaffold(
      backgroundColor: const Color(0xFFFDF8F2),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.black,
        elevation: 0,
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.w500),
        ),
      ),
      body: FutureBuilder<QuerySnapshot>(
        future: FirebaseFirestore.instance
            .collection('borrowings')
            .where('userId', isEqualTo: userId)
            .where('bookId', isEqualTo: widget.bookId)
            .where('isReturned', isEqualTo: false)
            .get(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }

          final isBookBorrowed = snapshot.data?.docs.isNotEmpty ?? false;

          return Column(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              const SizedBox(height: 20),
              if (coverUrl != null && coverUrl.toString().startsWith('http'))
                Center(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Image.network(
                      coverUrl,
                      width: 140,
                      height: 200,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) =>
                      const Icon(Icons.broken_image, size: 100),
                    ),
                  ),
                )
              else
                const Icon(Icons.book, size: 100),

              const SizedBox(height: 24),
              Text(
                title,
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Penulis: $author',
                style: const TextStyle(fontSize: 16, color: Colors.black87),
              ),
              const SizedBox(height: 8),
              Text(
                'Kategori: $category',
                style: const TextStyle(fontSize: 14, color: Colors.black54),
              ),
              const SizedBox(height: 8),
              Text(
                'Stok tersedia: $stock',
                style: const TextStyle(fontSize: 14, color: Colors.black54),
              ),
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Text(
                  description,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 14, color: Colors.black87),
                ),
              ),
              const Spacer(),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                child: Column(
                  children: [
                    if (!isBookBorrowed)
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blue.shade600,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(30)),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          onPressed: () async {
                            await FirebaseFirestore.instance.collection('cart')
                                .doc(widget.bookId)
                                .set(widget.bookData);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Buku berhasil ditambahkan ke Cart')),
                            );
                          },
                          icon: const Icon(Icons.add_shopping_cart),
                          label: const Text('Tambahkan ke Cart'),
                        ),
                      ),
                    const SizedBox(height: 12),
                    if (!isBookBorrowed)
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green.shade600,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(30)),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          onPressed: () async {
                            await _borrowBook();
                          },
                          icon: const Icon(Icons.book),
                          label: const Text('Pinjam Buku'),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
      bottomNavigationBar: BottomAppBar(
        shape: const CircularNotchedRectangle(),
        notchMargin: 6.0,
        color: Colors.white,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            IconButton(
              icon: const Icon(Icons.home),
              onPressed: () {
                Navigator.pushNamed(context, '/home');
              },
            ),
            IconButton(
              icon: const Icon(Icons.chat),
              onPressed: () {
                Navigator.pushNamed(context, '/chatbot');
              },
            ),
            IconButton(
              icon: const Icon(Icons.history),
              onPressed: () {
                Navigator.pushNamed(context, '/returnHistory');
              },
            ),
            IconButton(
              icon: const Icon(Icons.shopping_cart),
              onPressed: () {
                Navigator.pushNamed(context, '/cart');
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _borrowBook() async {
    final user = FirebaseAuth.instance.currentUser;
    final userId = user?.uid ?? 'anonymous';

    final bookSnapshot = await FirebaseFirestore.instance.collection('books').doc(widget.bookId).get();
    final stock = bookSnapshot.data()?['stock'] ?? 0;

    if (stock <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Stok habis untuk buku: ${widget.bookData['title']}')),
      );
      return;
    }

    final now = DateTime.now();
    final dueDate = now.add(const Duration(days: 7));

    await FirebaseFirestore.instance.collection('borrowings').add({
      'userId': user!.uid,
      'bookId': widget.bookId,
      'title': widget.bookData['title'] ?? '',
      'borrowDate': Timestamp.fromDate(now),
      'returnDueDate': Timestamp.fromDate(dueDate),
      'isReturned': false,
      'returnedAt': null,
      'daysLate': 0,
      'damageCount': 0,
      'damageNote': '',
      'fine': 0,
    });

    await FirebaseFirestore.instance.collection('books').doc(widget.bookId).update({
      'stock': stock - 1,
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Buku berhasil dipinjam!')),
    );
  }
}
