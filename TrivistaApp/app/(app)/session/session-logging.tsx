/**
 * Allows users to manually log a training session including:
 * - Session type (run, bike, swim)
 * - Name, time, distance, and perceived effort ("feeling")
 * - Optional location (pre-populated via query param)
 * Data is validated before saving to Firestore under the current user’s `trainingSessions` collection.
 * iOS and Android handle type/feeling selection differently using native pickers or modal overlays.
 * @module
 */
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Platform, Modal, FlatList, TextInput, Keyboard, TouchableWithoutFeedback } from "react-native";
import React, { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import { db } from "@/lib/firebase-db";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import CustomAlert from "@/components/CustomAlert";
import { Trash2, Info } from "lucide-react-native";

/**
 * Renders a form for users to manually record a workout session.
 * Provides fields for session name, type, effort level, time, and distance.
 * Data is submitted to Firestore after validation.
 *
 * @returns {React.JSX.Element} 
 */
const SessionLogging = (): React.JSX.Element => {
  const { type, city } = useLocalSearchParams();
  const [selectedType, setSelectedType] = useState(type || "");
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [nameOfSession, setNameOfSession] = useState("");
  const [timeOfSession, setTimeOfSession] = useState("");
  const [rawTime, setRawTime] = useState("");
  const [formattedTime, setFormattedTime] = useState("");
  const [distanceOfSession, setDistanceOfSession] = useState("");
  const [feeling, setFeeling] = useState("");
  const [feelingModalVisible, setFeelingModalVisible] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const router = useRouter();

  const typeOptions = [
    { label: "Run", value: "run" },
    { label: "Bike", value: "bike" },
    { label: "Swim", value: "swim" },
  ];

  const feelingOptions = [
    { label: "Easy", value: "Easy" },
    { label: "Moderate", value: "Moderate" },
    { label: "Hard", value: "Hard" },
    { label: "Max Effort", value: "Max" },
  ];

  /**
   * Handles time input and formatting from user.
   * Automatically inserts colons for HH:MM:SS format as the user types.
   *
   * @param {string} text - Raw input string.
   */
  const handleTimeInput = (text: string) => {
    const digits = text.replace(/\D/g, "");

    const limited = digits.slice(0, 6);

    let formatted = "";
    if (limited.length <= 2) {
        formatted = limited;
    } else if (limited.length <= 4) {
        formatted = `${limited.slice(0, 2)}:${limited.slice(2)}`;
    } else {
        formatted = `${limited.slice(0, 2)}:${limited.slice(2, 4)}:${limited.slice(4)}`;
    }

    setRawTime(limited);
    setFormattedTime(formatted);
    setTimeOfSession(formatted);
  };

  /**
   * Validates and saves the session data to Firestore.
   * Computes total time in seconds and training pace.
   * Displays error alerts if required fields are missing.
   *
   * @async
   * @returns {Promise<void>}
   */
  const handleSave = async (): Promise<void> => {

    if (rawTime.length !== 6) {
      setAlertTitle("Invalid Time");
      setAlertMessage("Please enter the full time in HHMMSS format.");
      setAlertVisible(true);
      return;
    }

    if (!nameOfSession.trim()) {
      setAlertTitle("Missing Fields");
      setAlertMessage("Please give your training session a name.");
      setAlertVisible(true);
      return;
    }

    if (!selectedType) {
      setAlertTitle("Missing Fields");
      setAlertMessage("Please select a type for your training session.");
      setAlertVisible(true);
      return;
    }

    if (!feeling) {
      setAlertTitle("Missing Fields");
      setAlertMessage("Please select a feeling.");
      setAlertVisible(true);
      return;
    }

    if (!distanceOfSession.trim()) {
      setAlertTitle("Missing Distance");
      setAlertMessage("Please enter the distance for your session.");
      setAlertVisible(true);
      return;
    }

    const padded = rawTime.padStart(6, "0"); 
    const hours = parseInt(padded.slice(0, 2), 10);
    const minutes = parseInt(padded.slice(2, 4), 10);
    const seconds = parseInt(padded.slice(4, 6), 10);
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    const distanceInKm = Number(distanceOfSession);
    const calculatedPace = (totalSeconds / 60) / distanceInKm;

    try {
      const user = getAuth().currentUser;
      if (!user) {
        return;
      }

      await addDoc(collection(db, "users", user.uid, "trainingSessions"), {
        userId: user.uid,
        name: nameOfSession,
        type: selectedType,
        feeling,
        time: totalSeconds,
        distance: Number(distanceOfSession),
        pace: calculatedPace,
        createdAt: new Date().toISOString(),
        timestamp: serverTimestamp(),
        city,
      });

      router.push({
        pathname: "/(app)/(profile-tabs)/sessions",
      });
    } catch (err) {
      console.error("Failed to save session:", err);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
        <View style={styles.topBar}>
            <TouchableOpacity className="relative" onPress={() => router.back()}>
                <Trash2 color="white" size={28} />
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>SAVE IT</Text>
            <View style={{ width: 28 }} />
        </View>
        <View key={"name"} className="rounded-[10px] overflow-hidden border border-[#FACC15] mb-4 w-[90%] bg-white/10">
            <TextInput
            placeholder={"Give your session a name"}
            placeholderTextColor="#ccc"
            onChangeText={setNameOfSession}
            keyboardType="default"
            autoCapitalize="words"
            autoCorrect={false}
            className="text-white px-4 py-3"
            />
        </View>
        <TouchableOpacity
            onPress={() => {
            if (Platform.OS === "ios") setTypeModalVisible(true);
            }}
            style={{
            borderWidth: 1,
            borderColor: "#FACC15",
            borderRadius: 10,
            overflow: "hidden",
            marginBottom: 20,
            backgroundColor: "rgba(255,255,255,0.1)",
            width: "90%",
            }}
        >
            {Platform.OS === "ios" ? (
            <Text style={{ color: "white", padding: 12 }}>
                {selectedType ? typeOptions.find((t) => t.value === selectedType)?.label : "Select Type"}
            </Text>
            ) : (
            <Picker
                selectedValue={selectedType}
                onValueChange={(itemValue) => setSelectedType(itemValue)}
                style={{ color: "#ccc" }}
                dropdownIconColor="#FACC15"
            >
                <Picker.Item label="Select Type" value="" />
                {typeOptions.map((opt) => (
                <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                ))}
            </Picker>
            )}
        </TouchableOpacity>
        <Modal transparent animationType="fade" visible={typeModalVisible}>
            <TouchableOpacity
            onPress={() => setTypeModalVisible(false)}
            style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000000aa" }}
            >
            <View style={{ backgroundColor: "#fff", borderRadius: 10, width: "80%" }}>
                <FlatList
                data={typeOptions}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                    <TouchableOpacity
                    onPress={() => {
                        setSelectedType(item.value);
                        setTypeModalVisible(false);
                    }}
                    style={{ padding: 15 }}
                    >
                    <Text style={{ fontSize: 16 }}>{item.label}</Text>
                    </TouchableOpacity>
                )}
                />
            </View>
            </TouchableOpacity>
        </Modal>
        <TouchableOpacity
            onPress={() => {
            if (Platform.OS === "ios") setFeelingModalVisible(true);
            }}
            style={{
            borderWidth: 1,
            borderColor: "#FACC15",
            borderRadius: 10,
            overflow: "hidden",
            marginBottom: 20,
            backgroundColor: "rgba(255,255,255,0.1)",
            width: "90%",
            }}
        >
            {Platform.OS === "ios" ? (
            <Text style={{ color: "white", padding: 12 }}>
                {feeling ? feelingOptions.find((t) => t.value === feeling)?.label : "How did it feel?"}
            </Text>
            ) : (
            <Picker
                selectedValue={feeling}
                onValueChange={(itemValue) => setFeeling(itemValue)}
                style={{ color: "#ccc" }}
                dropdownIconColor="#FACC15"
            >
                <Picker.Item label="How did it feel?" value="" />
                {feelingOptions.map((opt) => (
                <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                ))}
            </Picker>
            )}
        </TouchableOpacity>

        <Modal transparent animationType="fade" visible={feelingModalVisible}>
            <TouchableOpacity
            onPress={() => setFeelingModalVisible(false)}
            style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000000aa" }}
            >
            <View style={{ backgroundColor: "#fff", borderRadius: 10, width: "80%" }}>
                <FlatList
                data={feelingOptions}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                    <TouchableOpacity
                    onPress={() => {
                        setFeeling(item.value);
                        setFeelingModalVisible(false);
                    }}
                    style={{ padding: 15 }}
                    >
                    <Text style={{ fontSize: 16 }}>{item.label}</Text>
                    </TouchableOpacity>
                )}
                />
            </View>
            </TouchableOpacity>
        </Modal>

        <View key={"time"} className="rounded-[10px] overflow-hidden border border-[#FACC15] mb-4 w-[90%] bg-white/10">
            <TextInput
            placeholder={"How much time did it take? (00:00:00)"}
            placeholderTextColor="#ccc"
            value={formattedTime}
            onChangeText={handleTimeInput}
            keyboardType="numeric"
            autoCapitalize="none"
            autoCorrect={false}
            className="text-white px-4 py-3"
            />
        </View>
        <View key={"distance"} className="rounded-[10px] overflow-hidden border border-[#FACC15] mb-4 w-[90%] bg-white/10">
            <TextInput
            placeholder={"How many kilometers? (00.00km)"}
            placeholderTextColor="#ccc"
            onChangeText={setDistanceOfSession}
            keyboardType="numeric"
            autoCapitalize="none"
            autoCorrect={false}
            className="text-white px-4 py-3"
            />
        </View>
        <TouchableOpacity
            onPress={handleSave}
            style={{
            backgroundColor: "#FACC15",
            padding: 15,
            borderRadius: 10,
            marginTop: 20,
            width: "90%",
            alignItems: "center",
            }}
        >
            <Text className="text-center text-[#1e1e1e] font-[Bison]" style={{ letterSpacing: 1.5, fontSize: 20 }}>Save Session</Text>
        </TouchableOpacity>
        <CustomAlert
            visible={alertVisible}
            title={alertTitle}
            message={alertMessage}
            onClose={() => setAlertVisible(false)}
        />
        </View>
    </TouchableWithoutFeedback>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1E1E1E",
    paddingTop: 122,
    alignItems: "center",
  },
  mapContainer: {
    width: width * 0.9,
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  innerMap: {
    width: '100%',
    height: '100%',
  },
  stats: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
  },
  stat: {
    fontSize: 30,
    color: "white",
    fontFamily: "Bison",
    letterSpacing: 1.5,
    textAlign: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 10,
    padding: 10,
  },
  statTitle: {
    fontSize: 15,
    color: "white",
    fontFamily: "Bison",
    letterSpacing: 1.5,
    textAlign: "center",
    marginBottom: 5,
  },
  statBottom: {
    fontSize: 14,
    color: "#ccc",
    fontFamily: "InterRegular",
    textAlign: "center",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: "#1E1E1E",
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  topBarTitle: {
    fontSize: 25,
    fontFamily: "Bison",
    color: "#FACC15",
    letterSpacing: 1.5,
    textAlign: "center",
    flex: 1,
    position: "relative",
  },
});

export default SessionLogging;