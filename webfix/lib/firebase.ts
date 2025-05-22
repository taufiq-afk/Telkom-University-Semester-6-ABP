import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  type Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Firebase configuration for the library app
const firebaseConfig = {
  apiKey: "AIzaSyAJpI9GOM8Vp2ir_q69bSd8btVVJDRVxZg",
  authDomain: "librifyhub.firebaseapp.com",
  projectId: "librifyhub",
  storageBucket: "librifyhub.appspot.com",
  messagingSenderId: "647965852476",
  appId: "1:647965852476:web:d6535bcad2fdeb50789439",
};

// Create mock implementations for Firebase services
const createMockAuth = (): Auth => {
  const mockAuth: Partial<Auth> = {
    currentUser: null,
  };

  return mockAuth as Auth;
};

const createMockFirestore = (): Firestore => {
  const mockFirestore: Partial<Firestore> = {};
  return mockFirestore as Firestore;
};

// Firebase singleton pattern
let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseDb: Firestore | null = null;
let isFirebaseAvailable = false;

// Initialize Firebase with error handling
try {
  // Only initialize Firebase if it hasn't been initialized already
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApps()[0];
  }

  // Initialize auth and firestore
  if (firebaseApp) {
    firebaseAuth = getAuth(firebaseApp);
    firebaseDb = getFirestore(firebaseApp);
    isFirebaseAvailable = true;
    console.log("Firebase successfully initialized");
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
  isFirebaseAvailable = false;
}

// Export the Firebase services or their mock implementations
export const auth = firebaseAuth || createMockAuth();
export const db = firebaseDb || createMockFirestore();
export const isDemoMode = false; // Force to use Firebase instead of demo mode

// Export mock functions for demo mode
export const mockSignIn = async (email: string, password: string) => {
  return {
    user: {
      uid: "mock-user-id",
      email,
      displayName: "Demo User",
      metadata: { creationTime: new Date().toISOString() },
    },
  };
};

export const mockSignUp = async (email: string, password: string) => {
  return {
    user: {
      uid: "mock-user-id",
      email,
      displayName: "New User",
      metadata: { creationTime: new Date().toISOString() },
    },
  };
};

export const mockSignOut = async () => {
  console.log("Mock sign out");
};

// Helper function to safely use Firebase auth methods
export const safeSignIn = async (email: string, password: string) => {
  if (isDemoMode) {
    return mockSignIn(email, password);
  }
  return signInWithEmailAndPassword(auth, email, password);
};

export const safeSignUp = async (email: string, password: string) => {
  if (isDemoMode) {
    return mockSignUp(email, password);
  }
  return createUserWithEmailAndPassword(auth, email, password);
};

export const safeSignOut = async () => {
  if (isDemoMode) {
    return mockSignOut();
  }
  return signOut(auth);
};
