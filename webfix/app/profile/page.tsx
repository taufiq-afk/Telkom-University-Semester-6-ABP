"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, safeSignOut, isDemoMode } from "@/lib/firebase";
import { ArrowLeft, UserIcon, LogOut } from "lucide-react";
import Navbar from "@/components/navbar";

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [demoMode, setDemoMode] = useState(isDemoMode);
  const router = useRouter();

  useEffect(() => {
    let unsubscribe = () => {};

    try {
      if (demoMode) {
        // Set mock user data in demo mode
        setUser({
          uid: "mock-user-id",
          email: "demo@example.com",
          displayName: "Demo User",
          metadata: {
            creationTime: new Date().toISOString(),
            lastSignInTime: new Date().toISOString(),
          },
        } as User);
      } else {
        // Use real Firebase auth in production mode
        unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          setUser(firebaseUser);
          if (!firebaseUser) {
            router.push("/login");
          }
        });
      }
    } catch (error) {
      console.error("Auth state error:", error);
      // Fallback to demo mode if there's an error
      setDemoMode(true);
      setUser({
        uid: "mock-user-id",
        email: "demo@example.com",
        displayName: "Demo User",
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
        },
      } as User);
    }

    return () => unsubscribe();
  }, [demoMode, router]);

  const handleLogout = async () => {
    try {
      await safeSignOut();

      if (demoMode) {
        alert("Demo Mode: Logged out successfully! Redirecting to login page.");
      }

      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect to login on error
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
        </div>

        {demoMode && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
            <p className="font-medium">Demo Mode Active</p>
            <p className="text-sm mt-1">
              Firebase is not configured. The app is running with mock user
              data.
            </p>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md mx-auto">
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-gold-400 flex items-center justify-center shadow-md">
              <UserIcon className="text-white h-16 w-16" />
            </div>
            <br />
            <p className="mt-1 text-gray-600">{user?.email || "-"}</p>

            {/* User Info */}
            <div className="w-full mt-8 space-y-4 border-t border-gray-100 pt-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Account Type</span>
                <span className="font-medium text-gray-900">Student</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Member Since</span>
                <span className="font-medium text-gray-900">
                  {user?.metadata?.creationTime
                    ? new Date(user.metadata.creationTime).toLocaleDateString()
                    : "-"}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="mt-8 w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
