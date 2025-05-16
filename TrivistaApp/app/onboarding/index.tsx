/**
 * Onboarding Step 1
 *
 * Introduction screen that explains the purpose of the onboarding flow
 * and prepares the user to provide personal data.
 */
import { Text, TouchableOpacity, ImageBackground, View, Image } from "react-native";
import { router } from "expo-router";

/**
 * Onboarding1()
 *
 * Displays the first onboarding page with introductory text and a "Next" button.
 *
 * @returns {JSX.Element} First onboarding screen
 */
export default function Onboarding1() {

  return (
    <ImageBackground
      source={require("@/assets/images/background.png")}
      style={{ flex: 1, backgroundColor: "#1E1E1E" }}
      resizeMode="cover"
      className="justify-center items-center"
    >
      <View className="bg-white/30 rounded-2xl p-10 w-[85%] items-center">
        <Text className="text-[#FACC15] text-2xl font-[InterBold] mb-5 text-center">
          Before your journey can begin, we need to know a little about you
        </Text>
        <Text className="text-[#B4B4B4] text-base font-[InterRegular] mb-5 text-center">
          To be able to help you on each and every aspect of your triathlon journey, we'll need you to answer some questions before getting started. 
        </Text>
        <Image
          source={require("@/assets/images/bicycle.jpg")}
          className="rounded-2xl mb-5"
          style={{ width: "100%", height: 300 }}
          resizeMode="fit"
        />
        <View className="flex-row mb-5 py-2 px-2 w-[30%] justify-between items-center">
          <View className="bg-[#FACC15] w-[30px] h-[10px] rounded-[5px]"></View>
          <View className="bg-white w-[10px] h-[10px] rounded-[10px]"></View>
          <View className="bg-white w-[10px] h-[10px] rounded-[10px]"></View>
          <View className="bg-white w-[10px] h-[10px] rounded-[10px]"></View>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/onboarding/page2")}
          className="bg-[#FACC15] w-[100%] rounded-[10px] px-6 py-4 items-center"
        >
          <Text className="text-[#1E1E1E] font-[Bison]" style={{ letterSpacing: 1.5, fontSize: 20 }}>
            NEXT
          </Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}
