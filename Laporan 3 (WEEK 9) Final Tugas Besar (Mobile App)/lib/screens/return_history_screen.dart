import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class ReturnHistoryScreen extends StatelessWidget {
  const ReturnHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final userId = FirebaseAuth.instance.currentUser?.uid;

    if (userId == null) {
      return const Scaffold(
        body: Center(child: Text('Silakan login terlebih dahulu.')),
      );
    }

    // Fetch borrowed books that are not yet returned
    final borrowingsRef = FirebaseFirestore.instance
        .collection('borrowings')
        .where('userId', isEqualTo: userId)
        .where('isReturned', isEqualTo: false);  // Books not returned yet

    return Scaffold(
      backgroundColor: const Color(0xFFFDF8F2),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.black,
        elevation: 0,
        title: const Text('Daftar Buku Dipinjam'),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: borrowingsRef.snapshots(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }

          final borrowDocs = snapshot.data!.docs;

          if (borrowDocs.isEmpty) {
            return const Center(child: Text('Kamu tidak memiliki buku yang sedang dipinjam.'));
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: borrowDocs.length,
            itemBuilder: (context, index) {
              final borrow = borrowDocs[index].data() as Map<String, dynamic>;
              final bookId = borrow['bookId'];
              final borrowDate = (borrow['borrowDate'] as Timestamp).toDate();
              final returnDueDate = (borrow['returnDueDate'] as Timestamp).toDate();

              return FutureBuilder<DocumentSnapshot>(
                future: FirebaseFirestore.instance.collection('books').doc(bookId).get(),
                builder: (context, bookSnapshot) {
                  if (!bookSnapshot.hasData) return const SizedBox.shrink();

                  final bookData = bookSnapshot.data!.data() as Map<String, dynamic>;
                  final title = bookData['title'] ?? 'Tidak diketahui';
                  final author = bookData['author'] ?? '';
                  final coverUrl = bookData['coverUrl'];

                  return GestureDetector(
                    onTap: () {
                      Navigator.pushNamed(
                        context,
                        '/bookDetail',
                        arguments: {
                          'bookId': bookId,
                          'bookData': bookData,
                        },
                      );
                    },
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.grey.shade200,
                            blurRadius: 8,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          ClipRRect(
                            borderRadius: const BorderRadius.horizontal(left: Radius.circular(16)),
                            child: coverUrl != null && coverUrl.toString().startsWith('http')
                                ? Image.network(
                              coverUrl,
                              width: 90,
                              height: 130,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) =>
                              const Icon(Icons.broken_image, size: 60),
                            )
                                : const Icon(Icons.book, size: 60),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    title,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    author,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      color: Colors.black54,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Dipinjam: ${borrowDate.day}/${borrowDate.month}/${borrowDate.year}',
                                    style: const TextStyle(fontSize: 12),
                                  ),
                                  Text(
                                    'Deadline: ${returnDueDate.day}/${returnDueDate.month}/${returnDueDate.year}',
                                    style: const TextStyle(fontSize: 12, color: Colors.redAccent),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.assignment_return),
                            onPressed: () {
                              _showReturnConfirmation(context, bookId, bookData);
                            },
                          ),
                        ],
                      ),
                    ),
                  );
                },
              );
            },
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

  void _showReturnConfirmation(BuildContext context, String bookId, Map<String, dynamic> bookData) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Konfirmasi Pengembalian Buku'),
          content: const Text('Apakah Anda yakin ingin mengembalikan buku ini?'),
          actions: <Widget>[
            TextButton(
              child: const Text('Tidak'),
              onPressed: () {
                Navigator.of(context).pop(); // Membatalkan pengembalian
              },
            ),
            TextButton(
              child: const Text('Ya'),
              onPressed: () async {
                await _returnBook(bookId, bookData);
                Navigator.of(context).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Buku berhasil dikembalikan!')),
                );
              },
            ),
          ],
        );
      },
    );
  }

  Future<void> _returnBook(String bookId, Map<String, dynamic> bookData) async {
    final user = FirebaseAuth.instance.currentUser;
    final userId = user?.uid ?? 'anonymous';

    // Update status di koleksi 'borrowings'
    final borrowingsRef = FirebaseFirestore.instance.collection('borrowings');
    final borrowQuery = await borrowingsRef
        .where('userId', isEqualTo: userId)
        .where('bookId', isEqualTo: bookId)
        .where('isReturned', isEqualTo: false)
        .get();

    for (final doc in borrowQuery.docs) {
      await doc.reference.update({
        'isReturned': true,
        'returnedAt': Timestamp.now(),
      });
    }

    // Update stock di koleksi 'books'
    final bookRef = FirebaseFirestore.instance.collection('books').doc(bookId);
    final bookSnapshot = await bookRef.get();
    final currentStock = bookSnapshot.data()?['stock'] ?? 0;
    await bookRef.update({
      'stock': currentStock + 1,
    });
  }
}
