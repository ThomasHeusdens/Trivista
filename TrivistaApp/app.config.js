import "dotenv/config";

export default {
  expo: {
    name: "Trivista",
    slug: "Trivista",
    version: "1.0.0",
    description: "Trivista helps complete beginners prepare for their first sprint triathlon with an easy 12-week plan — no prior experience needed. From training and nutrition to stretching and recovery, the app guides you every step of the way.",
    owner: "Thomas Heusdens",
    orientation: "portrait",
    icon: "./assets/images/logo-trivista.png",
    scheme: "trivistaapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    backgroundColor: "#1E1E1E",
    splash: {
      image: "./assets/images/logo-trivista.png",
      resizeMode: "contain",
      backgroundColor: "#1E1E1E",
    },
    ios: {
      buildNumber: "1",
      supportsTablet: true,
      bundleIdentifier: "com.trivista.app",
      googleServicesFile: "./GoogleService-Info.plist",
      icon: "./assets/images/logo-trivista.png",
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY_IOS,
      },
      infoPlist: {
        NSLocationAlwaysAndWhenInUseUsageDescription: "App needs background location access for tracking training sessions.",
        NSLocationWhenInUseUsageDescription: "App uses your location to track your training.",
        UIBackgroundModes: ["location"],
      },
    },
    android: {
      versionCode: 1,
      googleServicesFile: "./google-services.json",
      primaryColor: "#FACC15",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptative-logo.png",
        backgroundColor: "#FACC15",
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
          image: "./assets/images/logo-trivista.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#1E1E1E",
          dark: {
            image: "./assets/images/logo-trivista.png",
            backgroundColor: "#1E1E1E",
          },
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
