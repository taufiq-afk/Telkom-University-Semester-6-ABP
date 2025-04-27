import 'package:flutter/material.dart';

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      primarySwatch: Colors.indigo,
      scaffoldBackgroundColor: const Color(0xFFFDF8F2),
      fontFamily: 'Chilanka',
      textTheme: const TextTheme(
        bodyMedium: TextStyle(color: Colors.black87),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.black87,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 50, vertical: 14),
          elevation: 6,
          shadowColor: Colors.grey,
        ),
      ),
    );
  }
}
