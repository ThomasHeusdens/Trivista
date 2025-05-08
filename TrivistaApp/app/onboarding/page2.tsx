/**
 * Onboarding Step 2
 *
 * Collects basic user info (age, height, weight, gender, goal) and stores calculated nutrition needs in Firestore.
 */
import {
  Text,
  Pressable,
  ImageBackground,
  View,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { auth } from "@/lib/firebase-config";
import { db } from "@/lib/firebase-db";

/**
 * Onboarding2()
 *
 * Displays a form to gather body composition details and calculates calorie/macro needs.
 *
 * @returns {JSX.Element} Step 2 onboarding screen
 */
export default function Onboarding2() {
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [gender, setGender] = useState("");
  const [compositionGoal, setCompositionGoal] = useState("");
  const [loading, setLoading] = useState(false);

  const [genderModalVisible, setGenderModalVisible] = useState(false);
  const [goalModalVisible, setGoalModalVisible] = useState(false);

  const genderOptions = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
  ];

  const goalOptions = [
    { label: "Mild weight loss", value: "mildlose" },
    { label: "Maintain weight", value: "maintain" },
    { label: "Mild weight gain", value: "mildgain" },
  ];

  /**
   * Checks if a value is a valid whole number.
   *
   * @param {string} value - Input value
   * @returns {boolean} True if valid whole number
   */
  const isWholeNumber = (value: string) => /^\d+$/.test(value);

  /**
   * Validates form data, calculates nutrition targets, and saves to Firestore.
   *
   * @returns {Promise<void>}
   */
  const validateAndContinue = async () => {
    if (!age || !height || !weight || !gender || !compositionGoal) {
      Alert.alert("Missing Information", "Please complete all fields.");
      return;
    }

    if (!isWholeNumber(age) || !isWholeNumber(height) || !isWholeNumber(weight)) {
      Alert.alert("Invalid Input", "Age, height, and weight must be whole numbers.");
      return;
    }

    const ageNum = parseInt(age);
    const heightNum = parseInt(height);
    const weightNum = parseInt(weight);

    if (ageNum > 80) {
      Alert.alert("Invalid Age", "Age must be 80 or below.");
      return;
    }

    if (heightNum < 130 || heightNum > 230) {
      Alert.alert("Invalid Height", "Height must be between 130 and 230 cm.");
      return;
    }

    if (weightNum < 40 || weightNum > 160) {
      Alert.alert("Invalid Weight", "Weight must be between 40 and 160 kg.");
      return;
    }

    // BMR Calculation
    let bmr = 0;
    if (gender === "male") {
      bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5;
    } else {
      bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161;
    }

    const tdee = bmr * 1.55;
    let finalCalories = tdee;
    if (compositionGoal === "mildlose") finalCalories -= 250;
    if (compositionGoal === "mildgain") finalCalories += 250;

    const proteinGrams = Math.round((0.25 * finalCalories) / 4);
    const fatGrams = Math.round((0.25 * finalCalories) / 9);
    const carbsGrams = Math.round((0.50 * finalCalories) / 4);

    const user = auth.currentUser;
    if (user) {
      try {
        const userDocRef = doc(db, "UserNutrition", user.uid);
        await setDoc(userDocRef, {
          Calories: finalCalories,
          Protein: proteinGrams,
          Fat: fatGrams,
          Carbs: carbsGrams
        }, { merge: true });
      } catch (firestoreError) {
        console.error("Firestore write error:", firestoreError);
      }
    }

    router.push("/onboarding/page3");
  };

  const renderOptionModal = (
    visible: boolean,
    setVisible: (val: boolean) => void,
    options: { label: string; value: string }[],
    setter: (val: string) => void
  ) => (
    <Modal transparent animationType="fade" visible={visible}>
      <TouchableWithoutFeedback onPress={() => setVisible(false)}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000000aa" }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 10, width: "80%" }}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setter(item.value);
                    setVisible(false);
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
  );

  return (
    <ImageBackground
      source={require("@/assets/images/background.png")}
      style={{ flex: 1 }}
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
                Answer these questions
              </Text>
              <Text className="text-[#B4B4B4] text-base font-[InterRegular] mb-5 text-center">
                This will help us know how much calorie intake you'll have to get everyday based on your body composition goal.
              </Text>

              {[{ label: "Age", value: age, setter: setAge },
                { label: "Height (cm)", value: height, setter: setHeight },
                { label: "Weight (kg)", value: weight, setter: setWeight }].map(({ label, value, setter }) => (
                <View key={label} className="rounded-[10px] overflow-hidden border border-[#FACC15] mb-4 w-[100%] bg-white/10">
                  <TextInput
                    placeholder={label}
                    placeholderTextColor="#ccc"
                    value={value}
                    onChangeText={setter}
                    keyboardType="numeric"
                    className="text-white px-4 py-3"
                  />
                </View>
              ))}

              {/* Gender Picker */}
              <Pressable
                onPress={() => {
                  if (Platform.OS === "ios") setGenderModalVisible(true);
                }}
                className="rounded-[10px] overflow-hidden border border-[#FACC15] mb-4 w-[100%] bg-white/10"
              >
                {Platform.OS === "ios" ? (
                  <Text className="text-white px-4 py-3">
                    {gender ? genderOptions.find(g => g.value === gender)?.label : "Select Gender"}
                  </Text>
                ) : (
                  <Picker
                    selectedValue={gender}
                    onValueChange={(itemValue) => setGender(itemValue)}
                    style={{ color: "#ccc" }}
                    dropdownIconColor="#FACC15"
                  >
                    <Picker.Item label="Select Gender" value="" />
                    {genderOptions.map(opt => (
                      <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                    ))}
                  </Picker>
                )}
              </Pressable>

              {/* Goal Picker */}
              <Pressable
                onPress={() => {
                  if (Platform.OS === "ios") setGoalModalVisible(true);
                }}
                className="rounded-[10px] overflow-hidden border border-[#FACC15] mb-5 w-[100%] bg-white/10"
              >
                {Platform.OS === "ios" ? (
                  <Text className="text-white px-4 py-3">
                    {compositionGoal ? goalOptions.find(g => g.value === compositionGoal)?.label : "Select Goal"}
                  </Text>
                ) : (
                  <Picker
                    selectedValue={compositionGoal}
                    onValueChange={(itemValue) => setCompositionGoal(itemValue)}
                    style={{ color: "#ccc" }}
                    dropdownIconColor="#FACC15"
                  >
                    <Picker.Item label="Select Goal" value="" />
                    {goalOptions.map(opt => (
                      <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                    ))}
                  </Picker>
                )}
              </Pressable>

              {/* Progress & Button */}
              <View className="flex-row mb-5 py-2 px-2 w-[30%] justify-between items-center">
                <View className="bg-white w-[10px] h-[10px] rounded-[5px]" />
                <View className="bg-[#FACC15] w-[30px] h-[10px] rounded-[10px]" />
                <View className="bg-white w-[10px] h-[10px] rounded-[10px]" />
                <View className="bg-white w-[10px] h-[10px] rounded-[10px]" />
              </View>

              <Pressable
                onPress={validateAndContinue}
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
              </Pressable>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* iOS Picker Modals */}
      {renderOptionModal(genderModalVisible, setGenderModalVisible, genderOptions, setGender)}
      {renderOptionModal(goalModalVisible, setGoalModalVisible, goalOptions, setCompositionGoal)}
    </ImageBackground>
  );
}