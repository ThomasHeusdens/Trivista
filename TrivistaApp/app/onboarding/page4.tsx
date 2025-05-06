import { Text, Pressable, ImageBackground, View } from "react-native";
import { router } from "expo-router";
import { auth } from "@/lib/firebase-config";
import { updateProfile } from "firebase/auth";

export default function Onboarding4() {
  const finishOnboarding = async () => {
    const user = auth.currentUser;
    if (user) {
      console.log("🧠 User exists, updating photoURL...");
      await updateProfile(user, { photoURL: "onboarding-complete" });
      console.log("✅ Updated photoURL to onboarding-complete");
    } else {
      console.warn("❌ No user found!");
    }
    router.replace("/(app)/(drawer)/(tabs)/");
  };
  

  return (
    <ImageBackground
      source={require("@/assets/images/background.png")}
      style={{ flex: 1 }}
      resizeMode="cover"
      className="justify-center items-center"
    >
      <View className="bg-white/30 rounded-2xl p-10 w-[85%] items-center">
        <Text className="text-[#FACC15] text-2xl font-[InterBold] mb-5 text-center">
          When do you want to start?
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

        <Pressable
          onPress={finishOnboarding}
          className="bg-[#FACC15] w-[100%] rounded-[10px] px-6 py-4 items-center"
        >
          <Text className="text-[#1E1E1E] font-[Bison]" style={{ letterSpacing: 1.5, fontSize: 20 }}>
            NEXT
          </Text>
        </Pressable>
      </View>
    </ImageBackground>
  );
}
