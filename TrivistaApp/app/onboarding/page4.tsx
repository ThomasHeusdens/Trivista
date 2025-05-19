/**
 * Onboarding Step 4
 *
 * Final onboarding screen explaining the app’s mission and marking onboarding as complete.
 */
import { Text, TouchableOpacity, ImageBackground, View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { auth } from "@/lib/firebase-config";
import { updateProfile } from "firebase/auth";
import { useState } from "react";

/**
 * Onboarding4()
 *
 * Renders the final onboarding explanation and completes the user’s onboarding state.
 *
 * @returns {JSX.Element} Step 4 onboarding screen
 */
export default function Onboarding4() {
  const [loading, setLoading] = useState(false);

  /**
   * Marks onboarding as complete by updating the user's photoURL in Firebase Auth.
   *
   * @returns {Promise<void>}
   */
  const finishOnboarding = async () => {
    setLoading(true);
    const user = auth.currentUser;
    if (user) {
      await updateProfile(user, { photoURL: "onboarding-complete" });
    } else {
      console.warn("❌ No user found!");
      setLoading(false);
    }
    setLoading(false);
    router.replace("/(app)/(tabs)/eat");
  };
  

  return (
    <ImageBackground
      source={require("@/assets/images/background.png")}
      style={{ flex: 1, backgroundColor: "#1E1E1E" }}
      resizeMode="cover"
      className="justify-center items-center"
    >
      <View className="bg-white/30 rounded-2xl p-10 w-[85%] items-center">
        <Text className="text-[#FACC15] text-2xl font-[InterBold] mb-5 text-center">
          Why Trivista?
        </Text>
        <Text className="text-white text-base font-[InterRegular] mb-5 text-center">
          Training for a triathlon can feel overwhelming — it’s not just about swimming, biking, and running, but also stretching, eating right, and recovering well.{"\n\n"}
          That’s where Trivista comes in. We simplify your journey by guiding you through everything: from daily tips to smart nutrition and recovery habits.{"\n\n"}
          Over the next 12 weeks, you'll get personalized insights and tools to train smarter, track your meals, and stay consistent — without overthinking it.{"\n\n"}
          You train — we take care of the rest.
        </Text>

        {/* Progress Dots & Button */}
        <View className="flex-row mb-5 py-2 px-2 w-[30%] justify-between items-center">
          <View className="bg-white w-[10px] h-[10px] rounded-[5px]"></View>
          <View className="bg-white w-[10px] h-[10px] rounded-[10px]"></View>
          <View className="bg-white w-[10px] h-[10px] rounded-[10px]"></View>
          <View className="bg-[#FACC15] w-[30px] h-[10px] rounded-[10px]"></View>
        </View>

        <TouchableOpacity
          onPress={finishOnboarding}
          disabled={loading}
          className="bg-[#FACC15] w-[100%] rounded-[10px] px-6 py-4 items-center"
        >
          {loading ? (
            <ActivityIndicator color="#1E1E1E" />
          ) : (
            <Text className="text-[#1E1E1E] font-[Bison]" style={{ letterSpacing: 1.5, fontSize: 20 }}>
              DONE
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}
