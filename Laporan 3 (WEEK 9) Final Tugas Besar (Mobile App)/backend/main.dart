import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  await FirebaseAuth.instance.signInAnonymously(); // Anonymous login
  runApp(const LibrifyAssistant());
}

class LibrifyAssistant extends StatelessWidget {
  const LibrifyAssistant({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: const ChatPage(),
    );
  }
}

class ChatPage extends StatefulWidget {
  const ChatPage({super.key});

  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final TextEditingController _controller = TextEditingController();
  final List<Map<String, String>> messages = [];
  bool isLoading = false;

  Future<void> sendMessage(String text) async {
    setState(() {
      messages.add({'sender': 'user', 'text': text});
      isLoading = true;
    });

    try {
      final user = FirebaseAuth.instance.currentUser;

      final response = await http.post(
        Uri.parse('http://localhost:5000/chat'), // Ganti localhost kalau perlu
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'message': text,
          'userId': user?.uid ?? '', // Kirim userId untuk cek pengembalian
        }),
      );

      final data = jsonDecode(response.body);
      final reply = data['reply'] ?? "Maaf, tidak ada respon.";

      setState(() {
        messages.add({'sender': 'bot', 'text': reply});
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        messages.add({'sender': 'bot', 'text': 'Gagal menghubungi server.'});
        isLoading = false;
      });
    }
  }

  Widget buildMessage(Map<String, String> message) {
    final isUser = message['sender'] == 'user';
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
        padding: const EdgeInsets.all(12),
        constraints: const BoxConstraints(maxWidth: 300),
        decoration: BoxDecoration(
          color: isUser ? Colors.amber[200] : Colors.grey[100],
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          message['text'] ?? '',
          style: const TextStyle(fontSize: 15),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFEF6EF),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF1C38F),
        elevation: 2,
        title: const Text(
          'Librify Assistant',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        leading: const Icon(Icons.menu_book),
        actions: const [Icon(Icons.info_outline)],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(12),
              children: messages.map(buildMessage).toList(),
            ),
          ),
          if (isLoading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: CircularProgressIndicator(),
            ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: InputDecoration(
                      hintText:
                          "Tanya stok buku, pengembalian, atau apa saja...",
                      filled: true,
                      fillColor: Colors.white,
                      contentPadding: const EdgeInsets.symmetric(
                          vertical: 10, horizontal: 20),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(30),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.send_rounded, color: Colors.amber),
                  onPressed: () {
                    if (_controller.text.trim().isNotEmpty) {
                      sendMessage(_controller.text.trim());
                      _controller.clear();
                    }
                  },
                )
              ],
            ),
          )
        ],
      ),
    );
  }
}
