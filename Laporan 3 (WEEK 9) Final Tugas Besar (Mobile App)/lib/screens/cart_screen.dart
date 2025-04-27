import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final selectedBooks = <String>{};

  @override
  Widget build(BuildContext context) {
    final cartRef = FirebaseFirestore.instance.collection('cart');

    return Scaffold(
      backgroundColor: const Color(0xFFFDF8F2),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.black,
        elevation: 0,
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Cart', style: TextStyle(fontWeight: FontWeight.bold)),
            StreamBuilder<QuerySnapshot>(
              stream: cartRef.snapshots(),
              builder: (context, snapshot) {
                final count = snapshot.data?.docs.length ?? 0;
                return Text(
                  '$count item(s)',
                  style: const TextStyle(fontSize: 14, color: Colors.black54),
                );
              },
            ),
          ],
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: cartRef.snapshots(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }

          final cartItems = snapshot.data!.docs;

          if (cartItems.isEmpty) {
            return const Center(child: Text('Keranjang kosong'));
          }

          return Column(
            children: [
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: cartItems.length,
                  itemBuilder: (context, index) {
                    final cartItem = cartItems[index];
                    final data = cartItem.data() as Map<String, dynamic>;
                    final title = data['title'] ?? '';
                    final author = data['author'] ?? '';
                    final coverUrl = data['coverUrl'];
                    final stock = data['stock'] ?? 0;
                    final bookId = cartItem.id;

                    return Container(
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
                          Checkbox(
                            value: selectedBooks.contains(bookId),
                            onChanged: (selected) {
                              setState(() {
                                if (selected == true) {
                                  selectedBooks.add(bookId);
                                } else {
                                  selectedBooks.remove(bookId);
                                }
                              });
                            },
                          ),
                          ClipRRect(
                            borderRadius: const BorderRadius.horizontal(left: Radius.circular(16)),
                            child: coverUrl != null && coverUrl.toString().startsWith("http")
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
                                  const SizedBox(height: 6),
                                  Text(
                                    'Stok tersedia: $stock',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Colors.redAccent,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete_outline),
                            onPressed: () async {
                              await cartItem.reference.delete();
                            },
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
              ElevatedButton(
                onPressed: selectedBooks.isEmpty ? null : () => _borrowSelectedBooks(cartItems),
                child: const Text('Pinjam Buku yang Dipilih'),
              ),
              const SizedBox(height: 10),
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
          ],
        ),
      ),
    );
  }

  Future<void> _borrowSelectedBooks(List<QueryDocumentSnapshot> cartItems) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Silakan login terlebih dahulu')),
      );
      return;
    }

    for (final cartItem in cartItems) {
      final bookId = cartItem.id;
      if (!selectedBooks.contains(bookId)) continue;

      final bookData = cartItem.data() as Map<String, dynamic>;
      final bookSnapshot = await FirebaseFirestore.instance.collection('books').doc(bookId).get();
      final stock = bookSnapshot.data()?['stock'] ?? 0;

      if (stock <= 0) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Stok habis untuk buku: ${bookData['title']}')),
        );
        continue;
      }

      final now = DateTime.now();
      final dueDate = now.add(const Duration(days: 7));

      await FirebaseFirestore.instance.collection('borrowings').add({
        'userId': user.uid,
        'bookId': bookId,
        'borrowDate': Timestamp.fromDate(now),
        'returnDueDate': Timestamp.fromDate(dueDate),
        'isReturned': false,
        'returnedAt': null,
        'daysLate': 0,
        'damageCount': 0,
        'damageNote': '',
        'fine': 0,
      });

      await FirebaseFirestore.instance.collection('books').doc(bookId).update({
        'stock': stock - 1,
      });

      await FirebaseFirestore.instance.collection('cart').doc(bookId).delete();
    }

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Peminjaman selesai diproses.')),
    );

    setState(() {
      selectedBooks.clear();
    });
  }
}