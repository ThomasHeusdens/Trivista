import { ImageBackground, Image, Pressable, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { useSession } from "@/context";
import { router } from "expo-router";
import { BlurView } from "expo-blur";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const { signUp } = useSession();

  const handleRegister = async () => {
    try {
      return await signUp(email, password, name);
    } catch (err) {
      console.log("[handleRegister] ==>", err);
      return null;
    }
  };

  const handleSignUpPress = async () => {
    const resp = await handleRegister();
    if (resp) {
      router.replace("/(app)/");
    }
  };

  return (
    <ImageBackground
      source={require("@/assets/images/background.png")}
      style={{ flex: 1 }}
      resizeMode="cover"
      className="justify-center items-center"
    >
      {/* Welcome Text */}
      <Text className="text-white text-3xl mb-9 font-[InterBold]">Welcome Trivister!</Text>

      {/* Logo */}
      <Image
        source={require("@/assets/images/logo.png")}
        className="w-40 h-40 mb-9"
        resizeMode="contain"
      />

      {/* Toggle: Login / Register */}
      <View className="flex-row justify-between mb-9 w-[80%]">
        <Pressable
          onPress={() => router.replace("/sign-in")}
          className="bg-[#FACC15] rounded-[10px] px-6 py-5 w-[45%] items-center"
        >
          <Text
            className="text-[#1E1E1E] font-[Bison]"
            style={{
              letterSpacing: 1.5,
              fontSize: 20,
            }}
          >
            LOG IN
          </Text>
        </Pressable>

        <View className="bg-white/20 rounded-[10px] px-6 py-5 w-[45%] items-center">
          <Text
            className="text-white font-[Bison]"
            style={{
              letterSpacing: 1.5,
              fontSize: 20,
            }}
          >
            REGISTER
          </Text>
        </View>
      </View>

      {/* Input Fields */}
      <View className="w-[80%] mb-9 space-y-4">
        <BlurView intensity={60} tint="dark" className="rounded-[10px] overflow-hidden border border-white mb-4">
          <TextInput
            placeholder="First name"
            placeholderTextColor="#ccc"
            value={name}
            onChangeText={setName}
            textContentType="name"
            autoCapitalize="words"
            className="text-white px-4 py-3"
          />
        </BlurView>

        <BlurView intensity={60} tint="dark" className="rounded-[10px] overflow-hidden border border-white mb-4">
          <TextInput
            placeholder="Email"
            placeholderTextColor="#ccc"
            value={email}
            onChangeText={setEmail}
            textContentType="emailAddress"
            keyboardType="email-address"
            autoCapitalize="none"
            className="text-white px-4 py-3"
          />
        </BlurView>

        <BlurView intensity={60} tint="dark" className="rounded-[10px] overflow-hidden border border-white">
          <TextInput
            placeholder="Password"
            placeholderTextColor="#ccc"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="newPassword"
            className="text-white px-4 py-3"
          />
        </BlurView>
      </View>

      {/* Sign Up Button */}
      <Pressable
        onPress={handleSignUpPress}
        className="bg-[#FACC15] rounded-[10px] px-6 py-5 w-[80%]"
      >
        <Text
          className="text-center text-black text-base font-semibold font-[Bison]"
          style={{
            letterSpacing: 1.5,
            fontSize: 20,
          }}
        >
          GET STARTED
        </Text>
      </Pressable>
    </ImageBackground>
  );
}
