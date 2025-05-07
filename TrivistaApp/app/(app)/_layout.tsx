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

  console.log("🔍 User:", user);
  console.log("🔍 is onboarding complete:", user?.photoURL);

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!user) {
    return <Redirect href="/sign-in" />;
  }
  
  if (user?.photoURL !== "onboarding-complete") {
    console.log("⛔️ User has not completed onboarding");
    return <Redirect href="/onboarding" />;
  }
  
  console.log("✅ All good, rendering app");

  return <Slot />;
}