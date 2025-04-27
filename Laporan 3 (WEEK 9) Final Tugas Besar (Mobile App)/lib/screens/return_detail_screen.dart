import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class ReturnDetailScreen extends StatelessWidget {
  const ReturnDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final args = ModalRoute.of(context)?.settings.arguments;
    if (args == null || args is! Map<String, dynamic>) {
      return const Scaffold(
        body: Center(child: Text('Data pengembalian tidak ditemukan.')),
      );
    }

    final String bookId = args['bookId'];
    final Map<String, dynamic> bookData = args['bookData'];

    return Scaffold(
      backgroundColor: Colors.black,
      body: ReturnBookForm(bookId: bookId, bookData: bookData),
    );
  }
}

class ReturnBookForm extends StatefulWidget {
  final String bookId;
  final Map<String, dynamic> bookData;

  const ReturnBookForm({super.key, required this.bookId, required this.bookData});

  @override
  State<ReturnBookForm> createState() => _ReturnBookFormState();
}

class _ReturnBookFormState extends State<ReturnBookForm> {
  int daysLate = 0;
  int damageCount = 0;
  DateTime? returnDueDate;
  bool isLoading = true;
  final TextEditingController damageNoteController = TextEditingController();

  int get totalFine => (daysLate * 1000) + (damageCount * 5000);

  @override
  void initState() {
    super.initState();
    _calculateLateDays();
  }

  Future<void> _calculateLateDays() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    try {
      final borrowingsRef = FirebaseFirestore.instance.collection('borrowings');
      final borrowQuery = await borrowingsRef
          .where('userId', isEqualTo: user.uid)
          .where('bookId', isEqualTo: widget.bookId)
          .where('isReturned', isEqualTo: false)
          .limit(1)
          .get();

      if (borrowQuery.docs.isNotEmpty) {
        final borrowingData = borrowQuery.docs.first.data();
        final Timestamp dueTimestamp = borrowingData['returnDueDate'];
        final dueDate = dueTimestamp.toDate();
        final now = DateTime.now();

        final lateDuration = now.difference(dueDate).inMinutes;
        setState(() {
          daysLate = lateDuration > 0 ? (lateDuration / 1).ceil() : 0; // hitung tiap 1 menit
          returnDueDate = dueDate;
          isLoading = false;
        });
      } else {
        setState(() {
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return Center(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 20),
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: Color(0xFFFDF8F2),
          borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
          boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 10)],
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Align(
                alignment: Alignment.topRight,
                child: IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ),
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: widget.bookData['coverUrl'] != null
                    ? Image.network(
                  widget.bookData['coverUrl'],
                  height: 140,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) =>
                  const Icon(Icons.broken_image, size: 60),
                )
                    : const Icon(Icons.book, size: 60),
              ),
              const SizedBox(height: 15),
              const Text(
                "Detail Pengembalian Buku",
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text("Total Hari Terlambat:"),
                  Text('$daysLate hari'),
                ],
              ),
              const SizedBox(height: 12),
              buildCounterRow("Jumlah Kerusakan", damageCount, (v) => setState(() => damageCount = v)),
              const SizedBox(height: 10),
              TextField(
                controller: damageNoteController,
                maxLines: 2,
                decoration: InputDecoration(
                  hintText: "Detail kerusakan",
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  contentPadding: const EdgeInsets.all(12),
                ),
              ),
              const SizedBox(height: 20),
              const Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  "Total Denda",
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                "Rp $totalFine",
                style: const TextStyle(fontSize: 16),
              ),
              const SizedBox(height: 18),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange.shade200,
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                    ),
                    onPressed: () => Navigator.pop(context),
                    child: const Text("Cancel"),
                  ),
                  const SizedBox(width: 12),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.indigo.shade100,
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                    ),
                    onPressed: _submitReturn,
                    child: const Text("Submit"),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Text(
                "Notes: Kerusakan Buku ditanggung peminjam",
                style: TextStyle(fontSize: 10, color: Colors.black54),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget buildCounterRow(String title, int value, Function(int) onChanged) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(child: Text(title)),
          IconButton(
            icon: const Icon(Icons.remove),
            onPressed: () => onChanged(value > 0 ? value - 1 : 0),
          ),
          Text('$value'),
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => onChanged(value + 1),
          ),
        ],
      ),
    );
  }

  Future<void> _submitReturn() async {
    final note = damageNoteController.text.trim();
    final user = FirebaseAuth.instance.currentUser;

    try {
      await FirebaseFirestore.instance.collection('returns').add({
        'bookId': widget.bookId,
        'userId': user?.uid ?? 'anonymous',
        'daysLate': daysLate,
        'damageCount': damageCount,
        'damageNote': note,
        'fine': totalFine,
        'returnedAt': Timestamp.now(),
      });

      final borrowingsRef = FirebaseFirestore.instance.collection('borrowings');
      final borrowQuery = await borrowingsRef
          .where('userId', isEqualTo: user?.uid ?? 'anonymous')
          .where('bookId', isEqualTo: widget.bookId)
          .where('isReturned', isEqualTo: false)
          .get();

      for (final doc in borrowQuery.docs) {
        await doc.reference.update({
          'isReturned': true,
          'returnedAt': Timestamp.now(),
        });
      }

      final bookRef = FirebaseFirestore.instance.collection('books').doc(widget.bookId);
      final bookSnapshot = await bookRef.get();
      final currentStock = bookSnapshot.data()?['stock'] ?? 0;
      await bookRef.update({
        'stock': currentStock + 1,
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Pengembalian berhasil. Denda: Rp $totalFine")),
      );

      Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Gagal menyimpan data: $e")),
      );
    }
  }
}
