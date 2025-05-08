/**
 * App Layout
 *
 * This layout handles authentication and onboarding logic for all routes within the (app) group.
 * - Redirects unauthenticated users to sign-in.
 * - Redirects users who haven't completed onboarding to the onboarding flow.
 * - Renders child routes for authenticated and onboarded users.
 */
import { Text } from "react-native";
import { Redirect, Slot } from "expo-router";
import { useSession } from "@/context";

/**
 * AppLayout()
 *
 * Determines the user's access to protected routes based on auth and onboarding status.
 *
 * @returns {JSX.Element} Redirect or layout content
 */
export default function AppLayout() {
  const { user, isLoading } = useSession();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!user) {
    return <Redirect href="/sign-in" />;
  }
  
  if (user?.photoURL !== "onboarding-complete") {
    return <Redirect href="/onboarding" />;
  }
  return <Slot />;
}