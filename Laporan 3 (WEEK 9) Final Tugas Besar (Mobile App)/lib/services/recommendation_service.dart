import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class RecommendationService {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Mengambil kategori terakhir dari buku yang dipinjam user
  static Future<String?> getLastBorrowedCategory() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return null;

    try {
      // Ambil data peminjaman terbaru
      final borrowSnapshot = await _firestore
          .collection('borrowings')
          .where('userId', isEqualTo: user.uid)
          .orderBy('borrowDate', descending: true)
          .limit(1)
          .get();

      if (borrowSnapshot.docs.isEmpty) {
        return null;
      }

      final borrowData = borrowSnapshot.docs.first.data();
      final bookId = borrowData['bookId'];

      // Ambil data buku berdasarkan bookId
      final bookSnapshot = await _firestore.collection('books').doc(bookId).get();

      if (!bookSnapshot.exists) {
        return null;
      }

      final bookData = bookSnapshot.data();
      final category = bookData?['category'] as String?;
      return category;
    } catch (e) {
      print('Error in getLastBorrowedCategory: $e');
      return null;
    }
  }
}
