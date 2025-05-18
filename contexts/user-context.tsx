"use client"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth, isDemoMode } from "@/lib/firebase"

interface UserContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
})

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      if (isDemoMode) {
        // In demo mode, set a mock user
        setUser({
          uid: "mock-user-id",
          email: "demo@example.com",
          displayName: "Demo User",
          metadata: {
            creationTime: new Date().toISOString(),
            lastSignInTime: new Date().toISOString(),
          },
        } as User)
        setLoading(false)
        return () => {}
      }

      const unsubscribe = onAuthStateChanged(
        auth,
        (firebaseUser) => {
          setUser(firebaseUser)
          setLoading(false)
        },
        (error) => {
          console.error("Auth state error:", error)
          setUser(null)
          setLoading(false)
        },
      )

      return () => unsubscribe()
    } catch (error) {
      console.error("Auth initialization error:", error)
      setUser(null)
      setLoading(false)
      return () => {}
    }
  }, [])

  return <UserContext.Provider value={{ user, loading, isAuthenticated: !!user }}>{children}</UserContext.Provider>
}

export const useUser = () => useContext(UserContext)
