import 'package:flutter/material.dart';

class HistoryScreen extends StatelessWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final List<String> historyItems = [
      'You asked: How to borrow books? -> Bot: Just click the borrow button.',
      'You asked: My deadline? -> Bot: Return by April 22, 2025.',
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('History'),
        centerTitle: true,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: historyItems.length,
        itemBuilder: (context, index) => Card(
          margin: const EdgeInsets.symmetric(vertical: 8),
          child: ListTile(
            title: Text(historyItems[index]),
            leading: const Icon(Icons.history),
          ),
        ),
      ),
    );
  }
}
