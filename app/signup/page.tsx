"use client"
import { useState } from "react"
import type React from "react"
import { safeSignUp, isDemoMode } from "@/lib/firebase"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Lock, UserPlus, BookOpen, AlertCircle } from "lucide-react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [demoMode, setDemoMode] = useState(isDemoMode)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      await safeSignUp(email, password)

      if (demoMode) {
        setError(null)
        alert("Demo Mode: Sign up successful! Redirecting to login page.")
      }

      router.push("/login") // redirect to login page after successful signup
    } catch (error: any) {
      console.error("Sign up error:", error)
      setError(error.message || "An error occurred during sign up")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-white rounded-full shadow-sm mb-4">
            <BookOpen className="h-10 w-10 text-gold-500" />
          </div>
          <h1 className="text-2xl font-bold text-gradient-gold">Library App</h1>
        </div>

        {demoMode && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
            <p className="font-medium">Demo Mode Active</p>
            <p className="text-sm mt-1">
              Firebase is not configured. The app is running in demo mode with mock authentication.
            </p>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Sign Up</h2>
            <p className="text-gray-600 mt-1">Create your account</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-gold-400 focus:border-gold-400 transition-colors"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gold-400 hover:bg-gold-500 text-white py-3 rounded-lg font-medium transition-colors mt-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-gold-500 font-medium hover:text-gold-400">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
