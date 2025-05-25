/**
 * Step 3 in the onboarding flow.
 * Allows users to select a training start date and saves the selection to Firestore.
 * Provides platform-specific date selection UI and inline validation with alert feedback.
 * @module
 */
import {
  Text,
  TouchableOpacity,
  ImageBackground,
  View,
  Platform,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { useState } from "react";
import { db } from "@/lib/firebase-db";
import { doc, setDoc } from "firebase/firestore";
import { auth } from "@/lib/firebase-config";
import CustomAlert from "@/components/CustomAlert";

/**
 * Displays a start date picker for users to begin their training.
 * Validates the selected date and saves it to Firestore under the user's ID.
 * Includes platform-specific UI handling and animated transitions to the next onboarding step.
 *
 * @returns {React.JSX.Element} Step 3 onboarding screen
 */
export default function Onboarding3(): React.JSX.Element {
  const [startDate, setStartDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  /**
   * Returns an array of the next 7 dates with formatted labels and values.
   *
   * @returns {Array<{ label: string, value: string }>}.
   */
  const getNext7Days = (): Array<{ label: string; value: string; }> => {
    const days = [];
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
    };

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      const label = date.toLocaleDateString("en-GB", options);
      const value = date.toISOString().split("T")[0];

      days.push({ label, value });
    }

    return days;
  };

  const startDates = getNext7Days();

  /**
   * Validates the selected date, formats it, and stores it in Firestore.
   * @async
   * @returns {Promise<void>}
   */
  const handleContinue = async (): Promise<void> => {
    if (!startDate) {
      setAlertTitle("Missing Selection");
      setAlertMessage("Please select a start date.");
      setAlertVisible(true);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      return;
    }

    try {
      setLoading(true);

      const formattedDate = new Date(startDate)
        .toLocaleDateString("en-GB")
        .split("/")
        .join("-");

      const docRef = doc(db, "UserStartDate", user.uid);
      await setDoc(docRef, { startDate: formattedDate });

      router.push("/onboarding/page4");
    } catch (error) {
      console.error("❌ Firestore error:", error);
      setAlertTitle("Error");
      setAlertMessage("Failed to save your start date. Please try again.");
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("@/assets/images/background.png")}
      style={{ flex: 1, backgroundColor: "#1E1E1E" }}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={100}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }} className="justify-center items-center">
            <View className="bg-white/30 rounded-2xl p-10 w-[85%] items-center">
              <Text className="text-[#FACC15] text-2xl font-[InterBold] mb-5 text-center">
                When do you want to start?
              </Text>
              <Text className="text-[#B4B4B4] text-base font-[InterRegular] mb-5 text-center">
                Maybe you downloaded this app just to explore, but we encourage you to stop waiting. Start today or in the next few days — with our help, you'll become a real triathlete in just 12 weeks.{"\n\n"}
                Choose your start date carefully — it can't be changed later.
              </Text>

              {/* ✅ Picker */}
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS === "ios") setModalVisible(true);
                }}
                className="rounded-[10px] overflow-hidden border border-[#FACC15] mb-5 w-[100%] bg-white/10"
              >
                {Platform.OS === "ios" ? (
                  <Text className="text-white px-4 py-3">
                    {startDate
                      ? startDates.find((d) => d.value === startDate)?.label
                      : "Select start date"}
                  </Text>
                ) : (
                  <Picker
                    selectedValue={startDate}
                    onValueChange={(itemValue) => setStartDate(itemValue)}
                    style={{ color: "#ccc" }}
                    dropdownIconColor="#FACC15"
                  >
                    <Picker.Item label="Select start date" value="" />
                    {startDates.map((day) => (
                      <Picker.Item key={day.value} label={day.label} value={day.value} />
                    ))}
                  </Picker>
                )}
              </TouchableOpacity>

              {/* Progress & Button */}
              <View className="flex-row mb-5 py-2 px-2 w-[30%] justify-between items-center">
                <View className="bg-white w-[10px] h-[10px] rounded-[5px]" />
                <View className="bg-white w-[10px] h-[10px] rounded-[10px]" />
                <View className="bg-[#FACC15] w-[30px] h-[10px] rounded-[10px]" />
                <View className="bg-white w-[10px] h-[10px] rounded-[10px]" />
              </View>

              <TouchableOpacity
                onPress={handleContinue}
                disabled={loading}
                className="bg-[#FACC15] w-[100%] rounded-[10px] px-6 py-4 items-center"
              >
                {loading ? (
                  <ActivityIndicator color="#1E1E1E" />
                ) : (
                  <Text className="text-[#1E1E1E] font-[Bison]" style={{ letterSpacing: 1.5, fontSize: 20 }}>
                    NEXT
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* iOS Modal Picker */}
      <Modal transparent animationType="fade" visible={modalVisible}>
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000000aa" }}>
            <View style={{ backgroundColor: "#fff", borderRadius: 10, width: "80%" }}>
              <FlatList
                data={startDates}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setStartDate(item.value);
                      setModalVisible(false);
                    }}
                    style={{ padding: 15 }}
                  >
                    <Text style={{ fontSize: 16 }}>{item.label}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
    </ImageBackground>
  );
}