import React from "react";
import { View, Text, Pressable, ImageBackground, StyleSheet, Dimensions } from "react-native";
import { useSession } from "@/context";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * TabsIndexScreen displays the main home screen content with personalized welcome message
 * with a full-screen background image that extends behind navigation bars
 * @returns {JSX.Element} Home screen component
 */
const TabsIndexScreen = () => {

  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;

  return (
    <>
      {/* Full screen background - positioned absolutely to go behind navigation */}
      <ImageBackground
        source={require("@/assets/images/background.png")}
        style={[
          styles.backgroundImage,
          {
            width: screenWidth,
            height: screenHeight,
          }
        ]}
        resizeMode="cover"
      />
      
      {/* Content */}
      <View className="flex-1 justify-center items-center p-4">
        {/* Welcome Section */}
        <View className="items-center mb-8">
          <Text className="text-xl font-bold text-white mb-2">
            Eat Page
          </Text>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: -1,
  }
});

export default TabsIndexScreen;