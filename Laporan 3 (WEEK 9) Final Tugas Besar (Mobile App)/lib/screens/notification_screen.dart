import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:intl/intl.dart';

class NotificationScreen extends StatelessWidget {
  const NotificationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final userId = FirebaseAuth.instance.currentUser?.uid;

    return Scaffold(
      backgroundColor: const Color(0xFFFDF8F2),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.black,
        elevation: 0,
        title: const Text(
          'Notifikasi',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('borrowings')
            .where('userId', isEqualTo: userId)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return const Center(child: Text('Terjadi kesalahan saat mengambil data.'));
          }

          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return const Center(child: Text('Tidak ada notifikasi saat ini.'));
          }

          final borrowings = snapshot.data!.docs;

          return ListView.builder(
            itemCount: borrowings.length,
            padding: const EdgeInsets.all(16),
            itemBuilder: (context, index) {
              final data = borrowings[index].data() as Map<String, dynamic>;
              final bookTitle = data['title'] ?? 'Buku Tidak Diketahui';
              final returnDueDateTimestamp = data['returnDueDate'];

              if (returnDueDateTimestamp == null || returnDueDateTimestamp is! Timestamp) {
                return const SizedBox();
              }

              final returnDate = returnDueDateTimestamp.toDate();
              final now = DateTime.now();

              String message;
              if (returnDate.isBefore(now)) {
                message = 'Sudah melewati batas pengembalian!';
              } else {
                final daysLeft = returnDate.difference(now).inDays;
                message = daysLeft == 0
                    ? 'Harus dikembalikan hari ini!'
                    : 'Sisa $daysLeft hari untuk mengembalikan.';
              }

              return Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.grey.shade300,
                      blurRadius: 6,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      Icons.notifications_active,
                      color: returnDate.isBefore(now) ? Colors.redAccent : Colors.orangeAccent,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            bookTitle,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Batas pengembalian: ${DateFormat('dd MMM yyyy').format(returnDate)}',
                            style: const TextStyle(fontSize: 14, color: Colors.black54),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            message,
                            style: TextStyle(
                              fontSize: 14,
                              color: returnDate.isBefore(now) ? Colors.red : Colors.orangeAccent,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
