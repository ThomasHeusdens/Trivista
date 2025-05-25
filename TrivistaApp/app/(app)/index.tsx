/**
 * App root route redirect.
 * Automatically routes users to the main "Eat" tab after onboarding is complete.
 * Serves as a passive entry point for authenticated sessions.
 * @module
 */
import { Redirect } from "expo-router";

/**
 * Redirects to the "/(app)/(tabs)/eat" route as the default landing page after onboarding.
 *
 * @returns {React.JSX.Element} Redirect component
 */
export default function Index(): React.JSX.Element {
  return <Redirect href="/(app)/(tabs)/eat" />;
}