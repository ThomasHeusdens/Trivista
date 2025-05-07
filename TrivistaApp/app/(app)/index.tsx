/**
 * (App) Index Redirect
 *
 * Automatically redirects authenticated users to the main "Eat" tab.
 */
import { Redirect } from "expo-router";

/**
 * Index()
 *
 * Immediately redirects to the main Eat tab after onboarding is complete.
 *
 * @returns {JSX.Element} Redirect component
 */
export default function Index() {
  return <Redirect href="/(app)/(tabs)/eat" />;
}