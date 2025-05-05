import { Text, Pressable, ImageBackground } from "react-native";
import { router } from "expo-router";
import { BlurView } from "expo-blur";

export default function Onboarding1() {

  return (
    <ImageBackground
      source={require("@/assets/images/background.png")}
      style={{ flex: 1 }}
      resizeMode="cover"
      className="justify-center items-center"
    >
      <BlurView intensity={60} tint="light" className="rounded-[10px] p-6 w-[85%] items-center">
        <Text className="text-white text-xl font-[InterBold] mb-6 text-center">
          Welcome to Trivista! This is Page 1.
        </Text>
        <Pressable
          onPress={() => router.push("/onboarding/page2")}
          className="bg-[#FACC15] rounded-[10px] px-6 py-4"
        >
          <Text className="text-[#1E1E1E] font-[Bison]" style={{ letterSpacing: 1.5, fontSize: 20 }}>
            NEXT
          </Text>
        </Pressable>
      </BlurView>
    </ImageBackground>
  );
}
