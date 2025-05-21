/**
 * Root Layout
 *
 * This file wraps the entire app with shared global providers and styles.
 * It sets up authentication context, gesture handling, font loading, and global layout configuration.
 */
import { SessionProvider } from "@/context";
import { Slot, SplashScreen } from "expo-router";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, StatusBar } from "react-native";
import { InfoAlertProvider } from "@/components/InfoAlertContext";
import "../global.css";

/**
 * Root()
 *
 * Entry layout component for the app. Loads custom fonts, initializes auth context,
 * sets up gesture support, and displays child routes.
 *
 * @returns {JSX.Element} Wrapped application layout
 */
export default function Root() {
  const [fontsLoaded] = useFonts({
    Bison: require("@/assets/fonts/bison.ttf"),
    InterBold: require("@/assets/fonts/Inter_24pt-Bold.ttf"),
    InterRegular: require("@/assets/fonts/Inter_24pt-Regular.ttf"),
    Sakana: require("@/assets/fonts/sakana.ttf"),
  });
  
  /**
   * Hides the splash screen once fonts are loaded.
   */
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" />
        <SessionProvider>
          <InfoAlertProvider>
            <GestureHandlerRootView style={styles.container}>
              <Slot />
            </GestureHandlerRootView>
          </InfoAlertProvider>
        </SessionProvider>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1E1E1E" 
  }
});