/**
 * SignUp screen for user registration.
 * Allows users to input their name, email, and password, and register via Firebase Auth.
 *
 * @returns {JSX.Element} The rendered sign-up form UI.
 */
import {
  ImageBackground,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Alert,
} from "react-native";
import { useState } from "react";
import { useSession } from "@/context";
import { router } from "expo-router";
import { BlurView } from "expo-blur";
import { ActivityIndicator } from "react-native";

/**
 * Renders the registration screen UI with inputs for name, email, and password.
 *
 * @returns {JSX.Element} A styled sign-up screen with registration logic.
 */
export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [repeatEmail, setRepeatEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useSession();

  /**
   * Validates email format with basic regex pattern.
   *
   * @param {string} email - Email input.
   * @returns {boolean}
   */
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  /**
   * Handles user registration with validation and Firebase sign-up.
   *
   * @returns {Promise<void>}
   */
  const handleSignUpPress = async () => {
    if (!name || !email || !repeatEmail || !password) {
      Alert.alert("Missing Fields", "Please fill in all the fields.");
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (email !== repeatEmail) {
      Alert.alert("Email Mismatch", "Email and repeat email do not match.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      const resp = await signUp(email, password, name);
      if (resp) {
        router.replace("/(app)/");
      } else {
        setLoading(false);
        Alert.alert("Email In Use", "This email address is already associated with another account.");
      }
    } catch (err) {
      setLoading(false);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ImageBackground
          source={require("@/assets/images/background.png")}
          style={{ flex: 1, backgroundColor: "#1E1E1E" }}
          resizeMode="cover"
          className="justify-center items-center"
        >
          <Text className="text-white text-3xl mb-2 font-[InterBold]">Welcome on Trivista!</Text>
          <Text className="text-white text-base mb-9 font-[InterRegular]">
            Train for your first sprint triathlon in just 12 weeks.
          </Text>
          <Image
            source={require("@/assets/images/logo.png")}
            className="w-36 h-36 mb-9"
            resizeMode="contain"
          />

          <View className="flex-row justify-between mb-9 w-[80%]">
            <Pressable
              onPress={() => router.replace("/sign-in")}
              className="bg-[#FACC15] rounded-[10px] px-6 py-5 w-[45%] items-center"
            >
              <Text className="text-[#1E1E1E] font-[Bison]" style={{ letterSpacing: 1.5, fontSize: 20 }}>
                LOG IN
              </Text>
            </Pressable>

            <View className="bg-white/20 rounded-[10px] px-6 py-5 w-[45%] items-center">
              <Text className="text-white font-[Bison]" style={{ letterSpacing: 1.5, fontSize: 20 }}>
                REGISTER
              </Text>
            </View>
          </View>

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

            <BlurView intensity={60} tint="dark" className="rounded-[10px] overflow-hidden border border-white mb-4">
              <TextInput
                placeholder="Repeat Email"
                placeholderTextColor="#ccc"
                value={repeatEmail}
                onChangeText={setRepeatEmail}
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

          {loading ? (
            <View className="bg-[#FACC15] rounded-[10px] px-6 py-5 w-[80%]">
              <ActivityIndicator size="small" color="#1E1E1E" />
            </View>
          ) : (
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
          )}
        </ImageBackground>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}