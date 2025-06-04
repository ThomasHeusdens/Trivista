# Trivista

A triathlon training app designed for athletic progression, combining nutrition, workouts, stretching, and recovery tips into one seamless user experience. Built with **React Native**, **Firebase**, and **Expo Router**, Trivista is made for beginners and keeps users motivated across 12-week training plan.

---

## License

This project is **licensed**, but not open-source. All rights are reserved by **Thomas Heusdens**.

> No part of this software, its design, code, or logic may be copied, modified, redistributed, or republished without explicit written consent from the author.

Refer to the [LICENSE](LICENSE.md) file for the full license.

---

## Why I'm Doing This Project

This app is the result of an academic thesis to:

- Solve real-world needs for triathlon preparation.
- Learn and apply scalable mobile development with secure cloud data storage.
- Improve onboarding flows, personalized AI-driven suggestions, and user metrics.

---

## Why It’s Useful

Trivista solves common problems triathletes face:

- Estimating calories and macros based on body composition goals.
- Easily tracking daily calories (and macros).
- Structuring training, recovery, and mobility in one clear schedule.
- Supporting beginners with guided content.
- Saving time not having to search for basic information about training, stretching, nutrition or recovery.

---

## Project Structure Overview

```
app/
├── (app)/                       # Main authenticated routes group
│   ├── (tabs)/                  # Bottom tab navigation for main features
│   │   ├── eat.tsx              # Nutrition dashboard (macros, calories)
│   │   ├── stretch.tsx          # Stretching routines and flexibility tips
│   │   ├── train.tsx            # Training plans, sessions, and activities
│   │   ├── recover.tsx          # Recovery tips and post-training advice
│   │   └── _layout.tsx          # Custom layout for top & bottom nav (main tabs)
│   │
│   ├── (profile-tabs)/          # Separate tab system for profile section
│   │   ├── sessions.tsx         # User session history
│   │   ├── faq.tsx              # Frequently Asked Questions
│   │   ├── progress.tsx         # Progress tracking and analytics
│   │   └── _layout.tsx          # Custom nav for profile section (cross icon, etc.)
│   │
│   ├── index.tsx                # Redirects to main tabs
│
├── onboarding/                  # Multi-step onboarding flow for new users
│   ├── index.tsx                # First onboarding screen (start of flow)
│   ├── page2.tsx                # User data input (age, height, weight, etc.)
│   ├── page3.tsx                # Training start date selection
│   ├── page4.tsx                # Final setup or intro screen
│   └── _layout.tsx              # Onboarding flow wrapper
│
├── sign-in.tsx                  # Sign-in screen for returning users
├── sign-up.tsx                  # Sign-up screen for new users
└── _layout.tsx                  # Root layout: provides auth context + fonts
```

---

## References & Research

### 🔐 Authentication & Firebase Integration

- **Login System**: [YouTube - Firebase Auth Setup](https://www.youtube.com/watch?si=R_FhSdTMjMsJUViW&v=Yva2Ep717v0&feature=youtu.be)
- **Expo Firebase Integration Guide**: [https://docs.expo.dev/guides/using-firebase/](https://docs.expo.dev/guides/using-firebase/)
- **Expo React Native Tutorials. Part 5: Firebase Integration**: [https://medium.com/@shawnastaff/expo-react-native-tutorials-7dbadc1767e7](https://medium.com/@shawnastaff/expo-react-native-tutorials-7dbadc1767e7)
- **Expo Firebase Auth – Accessing the Current User**: [https://firebase.google.com/docs/auth/web/manage-users#get_the_currently_signed-in_user](https://firebase.google.com/docs/auth/web/manage-users#get_the_currently_signed-in_user)

### 🔄 Firestore (Data Management)

- **Firestore: Add Data to Cloud Firestore**: [https://firebase.google.com/docs/firestore/manage-data/add-data](https://firebase.google.com/docs/firestore/manage-data/add-data)
- **Firestore – Get Data in React Native (Docs & Snapshots)**: [https://firebase.google.com/docs/firestore/query-data/get-data](https://firebase.google.com/docs/firestore/query-data/get-data)
- **Order and limit data with Cloud Firestore**: [https://firebase.google.com/docs/firestore/query-data/order-limit-data](https://firebase.google.com/docs/firestore/query-data/order-limit-data)
- **Firestore: Difference Between set with {merge: true} and update**: [https://stackoverflow.com/questions/46597327/difference-between-firestore-set-with-merge-true-and-update](https://stackoverflow.com/questions/46597327/difference-between-firestore-set-with-merge-true-and-update)

### 🧭 Location, Maps & Background Tracking

- **Expo Location API – Real-Time Location Tracking**: [https://docs.expo.dev/versions/latest/sdk/location/](https://docs.expo.dev/versions/latest/sdk/location/)
- **Expo TaskManager – Background Location Updates**: [https://docs.expo.dev/versions/latest/sdk/task-manager/](https://docs.expo.dev/versions/latest/sdk/task-manager/)
- **Location Tracking in Expo and React Native**: [https://chafikgharbi.com/expo-location-tracking/](https://chafikgharbi.com/expo-location-tracking/)
- **Background Location Tracking in React Native**: [https://arnav25.medium.com/background-location-tracking-in-react-native-d03bb7652602](https://arnav25.medium.com/background-location-tracking-in-react-native-d03bb7652602)
- **Expo Background Location with TaskManager in 6 minutes (YouTube)**: [https://www.youtube.com/watch?v=2NUUN0dX4kE](https://www.youtube.com/watch?v=2NUUN0dX4kE)
- **Reverse Geocoding with Expo Location**: [https://docs.expo.dev/versions/latest/sdk/location/#locationreversegeocodeasync](https://docs.expo.dev/versions/latest/sdk/location/#locationreversegeocodeasync)
- **Expo Location Permissions (Foreground & Background)**: [https://docs.expo.dev/versions/latest/sdk/location/#permissions](https://docs.expo.dev/versions/latest/sdk/location/#permissions)

### 🗺️ React Native Maps & Distance Calculations

- **React Native Maps (MapView, Polyline, animateToRegion)**: [https://github.com/react-native-maps/react-native-maps](https://github.com/react-native-maps/react-native-maps)
- **Calculating Distance Between Two Locations in React Native**: [https://aboutreact.com/react-native-calculate-distance-between-two-locations/](https://aboutreact.com/react-native-calculate-distance-between-two-locations/)
- **Geolib – Calculate Distance Between Coordinates**: [https://www.npmjs.com/package/geolib](https://www.npmjs.com/package/geolib)
- **React Native Maps: How to Fit Polyline Coordinates to Screen**: [https://stackoverflow.com/questions/65027899/react-native-map-how-to-fit-polyline-coordinates-to-screen](https://stackoverflow.com/questions/65027899/react-native-map-how-to-fit-polyline-coordinates-to-screen)
- **React Native Maps: Auto-Zoom into Markers**: [https://medium.com/@sohan.dutta11/react-native-maps-auto-zoom-into-markers-dd78c881d343](https://medium.com/@sohan.dutta11/react-native-maps-auto-zoom-into-markers-dd78c881d343)
- **Fit All Coordinates into the Bounds of the Map in React (Mapbox)**: [https://stackoverflow.com/questions/68666400/fit-all-coordinates-into-the-bounds-of-the-map-react-in-mapbox](https://stackoverflow.com/questions/68666400/fit-all-coordinates-into-the-bounds-of-the-map-react-in-mapbox)
- **Calculate Zoom Level with Polyline in React Native Mapbox GL**: [https://github.com/mapbox/react-native-mapbox-gl/issues/1316](https://github.com/mapbox/react-native-mapbox-gl/issues/1316)

### 📊 Charts & Data Visualization

- **React Native Chart Kit Documentation**: [https://www.npmjs.com/package/react-native-chart-kit/v/2.6.1](https://www.npmjs.com/package/react-native-chart-kit/v/2.6.1)

### 🎨 UI Components & Layout

- **Expo rendering Bug Fix**: [https://stackoverflow.com/q/79602687](https://stackoverflow.com/q/79602687)
- **Expo Router: Navigation Layouts**: [https://docs.expo.dev/router/basics/layout/](https://docs.expo.dev/router/basics/layout/)
- **Expo Router Tabs Documentation**: [https://docs.expo.dev/router/advanced/tabs/](https://docs.expo.dev/router/advanced/tabs/)
- **Custom Tab Layouts with Expo Router**: [https://docs.expo.dev/router/advanced/custom-tabs/](https://docs.expo.dev/router/advanced/custom-tabs/)
- **Expo Router: File-Based Routing**: [https://docs.expo.dev/develop/file-based-routing/](https://docs.expo.dev/develop/file-based-routing/)
- **Expo Router – Accessing Route Parameters with useLocalSearchParams**: [https://expo.github.io/router/docs/api/useLocalSearchParams](https://expo.github.io/router/docs/api/useLocalSearchParams)
- **React Navigation Bottom Tabs Navigator**: [https://reactnavigation.org/docs/bottom-tab-navigator/](https://reactnavigation.org/docs/bottom-tab-navigator/)
- **Lucide React Native Icons**: [https://lucide.dev/docs/lucide-react-native/](https://lucide.dev/docs/lucide-react-native/)
- **ActivityIndicator Documentation**: [https://reactnative.dev/docs/activityindicator](https://reactnative.dev/docs/activityindicator)
- **React Native Modal Component Documentation**: [https://reactnative.dev/docs/modal](https://reactnative.dev/docs/modal)
- **React Native Modal Selector (npm package)**: [https://www.npmjs.com/package/react-native-modal-selector](https://www.npmjs.com/package/react-native-modal-selector)
- **React Native Modal Picker Component (GitHub)**: [https://github.com/d-a-n/react-native-modal-picker](https://github.com/d-a-n/react-native-modal-picker)
- **React Native WebView (YouTube Embedding)**: [https://github.com/react-native-webview/react-native-webview](https://github.com/react-native-webview/react-native-webview)
- **Responsive Styling with Dimensions in React Native**: [https://reactnative.dev/docs/dimensions](https://reactnative.dev/docs/dimensions)

### 🎛️ Custom Alerts & Feedback

- **How to Create a Custom Alert Dialog in React Native (LogRocket)**: [https://blog.logrocket.com/create-custom-alert-dialog-react-native/](https://blog.logrocket.com/create-custom-alert-dialog-react-native/)
- **Creating a Reusable React Native Alert Modal (Medium)**: [https://zeallat94.medium.com/creating-a-reusable-reactnative-alert-modal-db5cbe7e5c2b](https://zeallat94.medium.com/creating-a-reusable-reactnative-alert-modal-db5cbe7e5c2b)

### 🔊 Audio, Feedback & Speech

- **Expo AV (Audio Playback for Beep)**: [https://docs.expo.dev/versions/latest/sdk/av/](https://docs.expo.dev/versions/latest/sdk/av/)
- **Expo Speech – Voice Feedback and TTS**: [https://docs.expo.dev/versions/latest/sdk/speech/](https://docs.expo.dev/versions/latest/sdk/speech/)
- **React Native Vibration API**: [https://reactnative.dev/docs/vibration](https://reactnative.dev/docs/vibration)

### ⏱️ Timers, Animations & Reanimated

- **Timers and requestAnimationFrame in React Native**: [https://reactnative.dev/docs/timers](https://reactnative.dev/docs/timers)
- **React Native Timer with useEffect and setInterval**: [https://dev.to/nathanieltaylor/react-native-countdown-timer-using-hooks-4mc3](https://dev.to/nathanieltaylor/react-native-countdown-timer-using-hooks-4mc3)
- **React Native Animations Documentation**: [https://reactnative.dev/docs/animations](https://reactnative.dev/docs/animations)
- **Animated Progress Bar Indicator in React Native using Animated API**: [https://www.youtube.com/watch?v=J95MC2Koymc](https://www.youtube.com/watch?v=J95MC2Koymc)
- **React Native Animated Donut Chart with Reanimated and SVG**: [https://dev.to/dimaportenko/react-native-animated-donut-pie-chart-reanimated-svg-32od](https://dev.to/dimaportenko/react-native-animated-donut-pie-chart-reanimated-svg-32od)
- **React Native Animated Donut Chart with React Native SVG and Animated API**: [https://www.youtube.com/watch?v=x2LtzCxbWI0](https://www.youtube.com/watch?v=x2LtzCxbWI0)
- **Expo Linear Gradient**: [https://docs.expo.dev/versions/latest/sdk/linear-gradient/](https://docs.expo.dev/versions/latest/sdk/linear-gradient/)

### 🧠 General JS / React Utilities

- **JavaScript Date toLocaleDateString() Method**: [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString)
- **Creating an Array of Dates Starting from Today**: [https://stackoverflow.com/questions/78547706/how-to-create-array-of-dates-starting-from-today-to-next-six-dates](https://stackoverflow.com/questions/78547706/how-to-create-array-of-dates-starting-from-today-to-next-six-dates)
- **React Native Conditional Rendering with useState/useEffect**: [https://reactjs.org/docs/hooks-state.html](https://reactjs.org/docs/hooks-state.html)
- **Macro Ratio Guide**: [https://www.trainingpeaks.com/blog/is-your-food-fueling-you-the-macronutrient-balance](https://www.trainingpeaks.com/blog/is-your-food-fueling-you-the-macronutrient-balance)
- **Calories & RMR**: [https://www.verywellhealth.com/how-many-calories-do-i-need-8417837](https://www.verywellhealth.com/how-many-calories-do-i-need-8417837)

### 🧭 Expo Router: Navigation & Authentication

- **Expo Router: Authentication Guide**: [https://docs.expo.dev/router/advanced/authentication/](https://docs.expo.dev/router/advanced/authentication/)
- **Expo Router: Authentication Using Redirects**: [https://docs.expo.dev/router/advanced/authentication-rewrites/](https://docs.expo.dev/router/advanced/authentication-rewrites/)
- **Expo Router: Redirects and Rewrites**: [https://docs.expo.dev/router/advanced/redirects/](https://docs.expo.dev/router/advanced/redirects/)
- **Expo Router: Root Layout Documentation**: [https://docs.expo.dev/router/advanced/root-layout/](https://docs.expo.dev/router/advanced/root-layout/)
- **Expo Router Authentication with Protected Routes & Persistent Login**: [https://medium.com/@siddhantshelake/expo-router-authentication-with-protected-routes-persistent-login-eed364e310cc](https://medium.com/@siddhantshelake/expo-router-authentication-with-protected-routes-persistent-login-eed364e310cc)
- **Handling Protected Routes with Expo Router**: [https://www.reddit.com/r/reactnative/comments/1cf0zyb/how_to_handle_protected_routes_with_expo_router/](https://www.reddit.com/r/reactnative/comments/1cf0zyb/how_to_handle_protected_routes_with_expo_router/)

### Other

- **Calculate RMR**: [https://www.verywellhealth.com/how-many-calories-do-i-need-8417837](https://www.verywellhealth.com/how-many-calories-do-i-need-8417837)
- **Carbs, proteins and fats split**: [https://www.trainingpeaks.com/blog/is-your-food-fueling-you-the-macronutrient-balance/](https://www.trainingpeaks.com/blog/is-your-food-fueling-you-the-macronutrient-balance/)

---

## Author

- **Thomas Heusdens** — _Developer, Designer, Architect_
  📧 [thomasheusdens@gmail.com](mailto:thomasheusdens@gmail.com)
  🐙 [GitHub](https://github.com/ThomasHeusdens)
  🎨 [Behance](https://www.behance.net/ThomasHeusdens)

---

## Contributing

Contributions are **not** open. This is a private academic project with restricted licensing.
