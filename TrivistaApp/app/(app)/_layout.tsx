/**
 * Layout wrapper for all routes in the (app) group.
 * Applies authentication and onboarding guards:
 * - Redirects unauthenticated users to the sign-in screen
 * - Redirects users with incomplete onboarding to the onboarding flow
 * - Renders nested routes for authenticated and onboarded users
 * @module
 */
import { View, ActivityIndicator } from "react-native";
import { Redirect, Slot } from "expo-router";
import { useSession } from "@/context";

/**
 * Conditionally renders protected routes based on session status.
 * Handles redirects for unauthenticated users and users who haven't completed onboarding.
 *
 * @returns {React.JSX.Element} Redirect or layout content
 */
export default function AppLayout(): React.JSX.Element {
  const { user, isLoading } = useSession();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1E1E1E" }}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/sign-in" />;
  }
  
  if (user?.photoURL !== "onboarding-complete") {
    return <Redirect href="/onboarding" />;
  }
  return <Slot />;
}