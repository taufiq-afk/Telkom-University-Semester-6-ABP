import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';

import 'firebase_options.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/home_screen.dart';
import 'screens/chatbot_screen.dart';
import 'screens/book_detail_screen.dart';
import 'routes/app_routes.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LibrifyHub',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primarySwatch: Colors.indigo,
        fontFamily: 'Chilanka',
      ),
      home: StreamBuilder<User?>(
        stream: FirebaseAuth.instance.authStateChanges(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasData) {
            return const HomeScreen();
          } else {
            return LoginScreen();
          }
        },
      ),
      onGenerateRoute: (settings) {
        if (settings.name == '/bookDetail') {
          final args = settings.arguments as Map<String, dynamic>;
          final bookData = args['bookData'];
          final bookId = args['bookId'];

          return MaterialPageRoute(
            builder: (context) => BookDetailScreen(
              bookId: bookId,
              bookData: bookData,
            ),
          );
        }
        // kalau bukan bookDetail, ambil dari appRoutes
        final builder = appRoutes[settings.name];
        if (builder != null) {
          return MaterialPageRoute(builder: builder);
        }
        return null; // jika route tidak ada
      },
      initialRoute: '/login',
    );
  }
}