import { Text, Pressable, ImageBackground } from "react-native";
import { router } from "expo-router";
import { auth } from "@/lib/firebase-config";
import { updateProfile } from "firebase/auth";
import { BlurView } from "expo-blur";

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
      <BlurView intensity={60} tint="light" className="rounded-[10px] p-6 w-[85%] items-center mb-4">
        <Text className="text-white text-xl font-[InterBold] mb-6 text-center">
          You're ready! Page 4 of 4.
        </Text>
        <Pressable
          onPress={finishOnboarding}
          className="bg-[#FACC15] rounded-[10px] px-6 py-4 w-[85%] items-center"
        >
          <Text
            className="text-[#1E1E1E] font-[Bison]"
            style={{ letterSpacing: 1.5, fontSize: 20 }}
          >
            GET STARTED
          </Text>
        </Pressable>
      </BlurView>
    </ImageBackground>
  );
}
