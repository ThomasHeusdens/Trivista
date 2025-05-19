import "dotenv/config";

export default {
  expo: {
    name: "TrivistaApp",
    slug: "TrivistaApp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "trivistaapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    backgroundColor: "#1E1E1E",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.trivista.app",
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY_IOS,
      },
      infoPlist: {
        UIBackgroundModes: ["location"],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      package: "com.trivista.app",
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
      ],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY_ANDROID,
        },
      },
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-secure-store",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#000000",
        },
      ],
      "expo-audio",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Allow App to use your location even when the app is in the background.",
          locationWhenInUsePermission:
            "Allow App to use your location when the app is in use.",
          isIosBackgroundLocationEnabled: true,
          isAndroidBackgroundLocationEnabled: true,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
  },
};
