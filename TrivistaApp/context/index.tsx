/**
 * Provides a global authentication context with state and auth actions.
 * @module
 */
import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import {
  getCurrentUser,
  login,
  logout,
  register,
} from "@/lib/firebase-service";
import { auth } from "@/lib/firebase-config";

/**
 * Describes available authentication methods and user state.
 * @interface
 */
interface AuthContextType {
  /**
   * Sign in an existing user using email and password.
   * @param email - The user's email address.
   * @param password - The user's password.
   * @returns A promise resolving to the signed-in user or undefined.
   */
  signIn: (email: string, password: string) => Promise<User | undefined>;

  /**
   * Register a new user with optional display name.
   * @param email - The user's email.
   * @param password - The user's password.
   * @param name - Optional display name.
   * @returns A promise resolving to the created user or undefined.
   */
  signUp: (
    email: string,
    password: string,
    name?: string
  ) => Promise<User | undefined>;

  /**
   * Logs out the current user.
   */
  signOut: () => void;

  user: User | null;
  isLoading: boolean;
}

/**
 * Authentication context for managing auth globally.
 * @type {React.Context<AuthContextType>}
 */
const AuthContext = createContext<AuthContextType>({} as AuthContextType);

/**
 * Hook to access the current authentication session.
 * @returns The auth context with state and methods.
 * @throws If used outside of <SessionProvider>.
 */
export function useSession(): AuthContextType {
  const value = useContext(AuthContext);

  if (process.env.NODE_ENV !== "production") {
    if (!value) {
      throw new Error("useSession must be wrapped in a <SessionProvider />");
    }
  }

  return value;
}

/**
 * Provides authentication context to child components.
 * @param children - Components that will use the context.
 * @returns Provider wrapping its children.
 */
export function SessionProvider(props: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Subscribes to Firebase auth changes and updates user state.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Signs in the user using Firebase.
   * @param email - Email address.
   * @param password - Password.
   * @returns The signed-in user or undefined if failed.
   */
  const handleSignIn = async (email: string, password: string) => {
    try {
      const response = await login(email, password);
      return response?.user;
    } catch (error) {
      console.error("[handleSignIn error] ==>", error);
      return undefined;
    }
  };

  /**
   * Registers a new user and optionally sets their name.
   * @param email - Email address.
   * @param password - Password.
   * @param name - Optional display name.
   * @returns The created user or undefined if failed.
   */
  const handleSignUp = async (
    email: string,
    password: string,
    name?: string
  ) => {
    try {
      const response = await register(email, password, name);
      return response?.user;
    } catch (error) {
      console.error("[handleSignUp error] ==>", error);
      return undefined;
    }
  };

  /**
   * Logs the user out and clears local state.
   */
  const handleSignOut = async () => {
    try {
      await logout();
      setUser(null);
    } catch (error) {
      console.error("[handleSignOut error] ==>", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
        user,
        isLoading,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}