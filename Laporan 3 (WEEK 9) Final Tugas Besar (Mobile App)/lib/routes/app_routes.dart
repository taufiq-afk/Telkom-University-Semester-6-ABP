import 'package:flutter/material.dart';
import '../screens/login_screen.dart';
import '../screens/register_screen.dart';
import '../screens/home_screen.dart';
import '../screens/book_detail_screen.dart';
import '../screens/chatbot_screen.dart';
import '../screens/profile_screen.dart';
import '../screens/return_detail_screen.dart';
import '../screens/cart_screen.dart';
import '../screens/return_history_screen.dart';
import 'package:librifyhub/screens/notification_screen.dart';

final Map<String, WidgetBuilder> appRoutes = {
  '/login': (context) => LoginScreen(),
  '/register': (context) => RegisterScreen(),
  '/home': (context) => const HomeScreen(),
  '/chatbot': (context) => const ChatbotScreen(),
  '/profile': (context) => const ProfileScreen(),
  '/returnDetail': (context) => const ReturnDetailScreen(),
  '/cart': (context) => const CartScreen(),
  '/returnHistory': (context) => const ReturnHistoryScreen(),
  '/notifications': (context) => const NotificationScreen(),
};
