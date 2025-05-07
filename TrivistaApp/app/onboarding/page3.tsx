/**
 * Onboarding Step 3
 *
 * Allows users to select their training start date and saves it to Firestore.
 */
import { Text, Pressable, ImageBackground, View, Alert } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { useState } from "react";
import { db } from "@/lib/firebase-db"; 
import { doc, setDoc } from "firebase/firestore";
import { auth } from "@/lib/firebase-config";

/**
 * Onboarding3()
 *
 * Renders the start date selection screen with a dynamic picker.
 *
 * @returns {JSX.Element} Step 3 onboarding screen
 */
export default function Onboarding3() {
  const [startDate, setStartDate] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * Returns an array of the next 7 dates with formatted labels and values.
   *
   * @returns {Array<{ label: string, value: string }>}
   */
  const getNext7Days = () => {
    const days = [];
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
    };

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      const label = date.toLocaleDateString("en-GB", options); // e.g., 'Monday 6 May'
      const value = date.toISOString().split("T")[0]; // e.g., '2024-05-06'

      days.push({ label, value });
    }

    return days;
  };

  const startDates = getNext7Days();

  /**
   * Validates the selected date, formats it, and stores it in Firestore.
   *
   * @returns {Promise<void>}
   */
  const handleContinue = async () => {
    if (!startDate) {
      Alert.alert("Missing Selection", "Please select a start date.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }

    try {
      setLoading(true);

      const formattedDate = new Date(startDate)
        .toLocaleDateString("en-GB")
        .split("/")
        .join("-"); // DD-MM-YYYY

      const docRef = doc(db, "UserStartDate", user.uid);
      await setDoc(docRef, { startDate: formattedDate });

      console.log("✅ Start date saved:", formattedDate);
      router.push("/onboarding/page4");
    } catch (error) {
      console.error("❌ Firestore error:", error);
      Alert.alert("Error", "Failed to save your start date. Please try again.");
    } finally {
      setLoading(false);
    }
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
        <Text className="text-[#B4B4B4] text-base font-[InterRegular] mb-5 text-center">
          You maybe downloaded this app to only discover it, but we want you to stop waiting.
          Start today or in the next days — with our help you'll be a real triathlete within 12 weeks.
        </Text>

        {/* ✅ Dynamic Start Date Picker */}
        <View className="rounded-[10px] overflow-hidden border border-[#FACC15] mb-5 w-[100%] bg-white/10">
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
        </View>

        {/* Progress Dots & Button */}
        <View className="flex-row mb-5 py-2 px-2 w-[30%] justify-between items-center">
          <View className="bg-white w-[10px] h-[10px] rounded-[5px]" />
          <View className="bg-white w-[10px] h-[10px] rounded-[10px]" />
          <View className="bg-[#FACC15] w-[30px] h-[10px] rounded-[10px]" />
          <View className="bg-white w-[10px] h-[10px] rounded-[10px]" />
        </View>

        <Pressable
          onPress={handleContinue}
          disabled={loading}
          className="bg-[#FACC15] w-[100%] rounded-[10px] px-6 py-4 items-center"
        >
          <Text className="text-[#1E1E1E] font-[Bison]" style={{ letterSpacing: 1.5, fontSize: 20 }}>
            {loading ? "Saving..." : "NEXT"}
          </Text>
        </Pressable>
      </View>
    </ImageBackground>
  );
}
