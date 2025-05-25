/**
 * SignIn screen for user authentication.
 * Allows users to input their email and password, and authenticate via Firebase Auth.
 *
 * @returns {JSX.Element} The rendered sign-in form UI.
 */
import {
  ImageBackground,
  Image,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useState } from "react";
import { useSession } from "@/context";
import { router } from "expo-router";
import { ActivityIndicator } from "react-native";
import CustomAlert from "@/components/CustomAlert";

/**
 * SignIn renders the sign-in screen with email and password input fields.
 *
 * @returns {JSX.Element} The complete sign-in UI.
 */
export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useSession();

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  /**
   * Validates email format with basic regex pattern.
   *
   * @param {string} email - The email to validate.
   * @returns {boolean}
   */
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  /**
   * Attempts to log in the user with validation and error handling.
   *
   * @returns {Promise<void>}
   */
  const handleSignInPress = async () => {
    if (!email || !password) {
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

    if (password.length < 6) {
      setAlertTitle("Weak Password");
      setAlertMessage("Password must be at least 6 characters.");
      setAlertVisible(true);
      return;
    }

    try {
      setLoading(true);
      const resp = await signIn(email, password);
      if (resp) {
        router.replace("/(app)/");
      } else {
        setLoading(false);
        setAlertTitle("Login Failed");
        setAlertMessage("Email or password is incorrect.");
        setAlertVisible(true);
      }
    } catch (err) {
      setLoading(false);
      setAlertTitle("Login Error");
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
          <Text className="text-white text-3xl mb-4 font-[InterBold]">
            Welcome Back!
          </Text>

          <Image
            source={require("@/assets/images/triathlon-logo.png")}
            className="w-[100%] h-[40px] mb-4"
            resizeMode="contain"
          />
          <Image
            source={require("@/assets/images/logo.png")}
            className="w-40 h-40 mb-9"
            resizeMode="contain"
          />

          <View className="flex-row justify-between mb-9 w-[80%]">
            <View className="bg-white/30 rounded-[10px] px-6 py-5 w-[45%] items-center">
              <Text
                className="text-white font-[Bison]"
                style={{ letterSpacing: 1.5, fontSize: 20 }}
              >
                LOG IN
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.replace("/sign-up")}
              className="bg-[#FACC15] rounded-[10px] px-6 py-5 w-[45%] items-center"
            >
              <Text
                className="text-[#1E1E1E] font-[Bison]"
                style={{ letterSpacing: 1.5, fontSize: 20 }}
              >
                REGISTER
              </Text>
            </TouchableOpacity>
          </View>

          <View className="w-[80%] mb-9 space-y-4">
            <View className="rounded-[10px] overflow-hidden border border-white mb-4">
              <TextInput
                placeholder="Email"
                placeholderTextColor="#ccc"
                value={email}
                onChangeText={setEmail}
                className="text-white px-4 py-3"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View className="rounded-[10px] overflow-hidden border border-white">
              <TextInput
                placeholder="Password"
                placeholderTextColor="#ccc"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                className="text-white px-4 py-3"
              />
            </View>
          </View>

          {loading ? (
            <View className="bg-[#FACC15] rounded-[10px] px-6 py-5 w-[80%]">
              <ActivityIndicator size="small" color="#1E1E1E" />
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleSignInPress}
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
    </KeyboardAvoidingView>
  );
}
