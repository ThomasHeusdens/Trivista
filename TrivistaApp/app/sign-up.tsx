/**
 * SignUp screen for user registration.
 * Allows users to input their name, email, and password, and register via Firebase Auth.
 *
 * @returns {JSX.Element} The rendered sign-up form UI.
 */
import {
  ImageBackground,
  Image,
  TouchableOpacity,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from "react-native";
import { useState } from "react";
import { useSession } from "@/context";
import { router } from "expo-router";
import { BlurView } from "expo-blur";
import { ActivityIndicator } from "react-native";
import CustomAlert from "@/components/CustomAlert";

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

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

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
      setAlertTitle("Missing Fields");
      setAlertMessage("Please fill in all the fields.");
      setAlertVisible(true);
      return;
    }

    if (!isValidEmail(email)) {
      setAlertTitle("Invalid Email");
      setAlertMessage("Please enter a valid email address.");
      setAlertVisible(true);
      return;
    }

    if (email !== repeatEmail) {
      setAlertTitle("Email Mismatch");
      setAlertMessage("Email and repeat email do not match.");
      setAlertVisible(true);
      return;
    }

    if (password.length < 6) {
      setAlertTitle("Weak Password");
      setAlertMessage("Password must be at least 6 characters.");
      setAlertVisible(true);
      return;
    }

    try {
      setLoading(true);
      const resp = await signUp(email, password, name);
      if (resp) {
        router.replace("/(app)/");
      } else {
        setLoading(false);
        setAlertTitle("Email In Use");
        setAlertMessage("This email address is already associated with another account.");
        setAlertVisible(true);
      }
    } catch (err) {
      setLoading(false);
      setAlertTitle("Error");
      setAlertMessage("Something went wrong. Please try again.");
      setAlertVisible(true);
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
            <TouchableOpacity
              onPress={() => router.replace("/sign-in")}
              className="bg-[#FACC15] rounded-[10px] px-6 py-5 w-[45%] items-center"
            >
              <Text className="text-[#1E1E1E] font-[Bison]" style={{ letterSpacing: 1.5, fontSize: 20 }}>
                LOG IN
              </Text>
            </TouchableOpacity>

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
            <TouchableOpacity
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
            </TouchableOpacity>
          )}
        </ImageBackground>
      </TouchableWithoutFeedback>
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
      <Image
        source={require("@/assets/images/triathlon-logo.png")}
        className="w-[100%] h-[40px] top-[50px] absolute"
        resizeMode="contain"
      />
    </KeyboardAvoidingView>
  );
}