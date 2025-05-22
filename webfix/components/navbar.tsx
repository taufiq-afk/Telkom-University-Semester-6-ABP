"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Menu,
  X,
  User,
  History,
  ShoppingCart,
  Bell,
  BookOpen,
  MessageCircle,
} from "lucide-react";
import { useUser } from "@/contexts/user-context";
import { isDemoMode } from "@/lib/firebase";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated } = useUser();
  const [demoMode, setDemoMode] = useState(isDemoMode);

  // Determine where to navigate based on auth state
  const getNavLink = (path: string) => {
    // In demo mode or when authenticated, go to the requested page
    // Otherwise, redirect to login
    return isAuthenticated ? path : "/login";
  };

  return (
    <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
      {demoMode && (
        <div className="bg-amber-50 text-amber-700 text-center text-sm py-1 px-4">
          Demo Mode: Firebase not configured. Using mock data.
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/home" className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-gold-500" />
              <span className="text-lg font-bold text-gradient-gold">
                Library App
              </span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href={getNavLink("/chatbot")}
              className="flex items-center gap-1.5 text-gray-600 hover:text-gold-400 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Assistant</span>
            </Link>
            <Link
              href={getNavLink("/history")}
              className="flex items-center gap-1.5 text-gray-600 hover:text-gold-400 transition-colors"
            >
              <History className="h-4 w-4" />
              <span>History</span>
            </Link>
            <Link
              href={getNavLink("/cart")}
              className="flex items-center gap-1.5 text-gray-600 hover:text-gold-400 transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Cart</span>
            </Link>
            <Link
              href={getNavLink("/notification")}
              className="flex items-center gap-1.5 text-gray-600 hover:text-gold-400 transition-colors"
            >
              <Bell className="h-4 w-4" />
              <span>Notification</span>
            </Link>
            <Link
              href={getNavLink("/profile")}
              className="flex items-center gap-1.5 text-gray-600 hover:text-gold-400 transition-colors"
            >
              <User className="h-4 w-4" />
              <span>{isAuthenticated ? "Profile" : "Login"}</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gold-400 focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href={getNavLink("/chatbot")}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-600 hover:bg-gold-100 hover:text-gold-500"
              onClick={() => setIsMenuOpen(false)}
            >
              <MessageCircle className="h-5 w-5" />
              <span>Assistant</span>
            </Link>
            <Link
              href={getNavLink("/history")}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-600 hover:bg-gold-100 hover:text-gold-500"
              onClick={() => setIsMenuOpen(false)}
            >
              <History className="h-5 w-5" />
              <span>History</span>
            </Link>
            <Link
              href={getNavLink("/cart")}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-600 hover:bg-gold-100 hover:text-gold-500"
              onClick={() => setIsMenuOpen(false)}
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Cart</span>
            </Link>
            <Link
              href={getNavLink("/notification")}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-600 hover:bg-gold-100 hover:text-gold-500"
              onClick={() => setIsMenuOpen(false)}
            >
              <Bell className="h-5 w-5" />
              <span>Notification</span>
            </Link>
            <Link
              href={getNavLink("/profile")}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-600 hover:bg-gold-100 hover:text-gold-500"
              onClick={() => setIsMenuOpen(false)}
            >
              <User className="h-5 w-5" />
              <span>{isAuthenticated ? "Profile" : "Login"}</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
