import { SessionProvider } from "@/context";
import { Slot, SplashScreen } from "expo-router";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ImageBackground, StyleSheet, StatusBar, View } from "react-native";
// Import your global CSS file
import "../global.css";

/**
 * Root Layout is the highest-level layout in the app, wrapping all other layouts and screens.
 * It provides:
 * 1. Global authentication context via SessionProvider
 * 2. Gesture handling support for the entire app
 * 3. Global styles and configurations
 * 4. App-wide background image that extends behind all navigation elements
 *
 * This layout affects every screen in the app, including both authenticated
 * and unauthenticated routes.
 */
export default function Root() {
  // Set up the auth context and render our layout inside of it.

  const [fontsLoaded] = useFonts({
    Bison: require("@/assets/fonts/bison.ttf"),
    InterBold: require("@/assets/fonts/Inter_24pt-Bold.ttf"),
    InterRegular: require("@/assets/fonts/Inter_24pt-Regular.ttf"),
    Sakana: require("@/assets/fonts/sakana.ttf"),
  });
  
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  return (
    <>
      {/* Set status bar to translucent to allow background to show behind it */}
      <StatusBar translucent backgroundColor="transparent" />
      
        <SessionProvider>
          {/* 
            GestureHandlerRootView is required for:
            - Drawer navigation gestures
            - Swipe gestures
            - Other gesture-based interactions
            Must wrap the entire app to function properly
          */}
          <GestureHandlerRootView style={styles.container}>
            {/* 
              Slot renders child routes dynamically
              This includes both (app) and (auth) group routes
            */}
            <Slot />
          </GestureHandlerRootView>
        </SessionProvider>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});