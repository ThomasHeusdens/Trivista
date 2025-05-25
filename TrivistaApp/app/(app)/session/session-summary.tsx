import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Platform, Modal, FlatList, TextInput } from "react-native";
import React, { useState, useEffect, useMemo } from "react";
import MapView, { Polyline } from "react-native-maps";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import { db } from "@/lib/firebase-db";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import CustomAlert from "@/components/CustomAlert";
import { Trash2 } from "lucide-react-native";

const SessionSummary = () => {
  const { time, distance, pace, coords, type, city } = useLocalSearchParams();
  const [selectedType, setSelectedType] = useState(type || "");
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [nameOfSession, setNameOfSession] = useState("");
  const [feeling, setFeeling] = useState("");
  const [feelingModalVisible, setFeelingModalVisible] = useState(false);
  const parsedCoords = useMemo(() => JSON.parse(coords || "[]"), [coords]);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const router = useRouter();
  const [mapRegion, setMapRegion] = useState({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

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

  useEffect(() => {
    if (parsedCoords && parsedCoords.length > 0) {
      const mapData = calculateCoordinateData(parsedCoords);
      setMapRegion({
        latitude: mapData.midLat,
        longitude: mapData.midLng,
        latitudeDelta: mapData.zoomLevel,
        longitudeDelta: mapData.zoomLevel,
      });
    }
  }, [coords]);

  const handleSave = async () => {
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
        time: Number(time),
        distance: (Number(distance) / 1000).toFixed(2),
        pace: Number(pace),
        coords: parsedCoords,
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

  const calculateCoordinateData = (points) => {
    if (!points || points.length === 0) {
      return {
        midLat: 0,
        midLng: 0,
        zoomLevel: 0.05, 
      };
    }

    let minLat = points[0].latitude;
    let maxLat = points[0].latitude;
    let minLng = points[0].longitude;
    let maxLng = points[0].longitude;

    points.forEach(({ latitude, longitude }) => {
      minLat = Math.min(minLat, latitude);
      maxLat = Math.max(maxLat, latitude);
      minLng = Math.min(minLng, longitude);
      maxLng = Math.max(maxLng, longitude);
    });

    const midLat = (minLat + maxLat) / 2;
    const midLng = (minLng + maxLng) / 2;

    const latDelta = (maxLat - minLat);
    const lngDelta = (maxLng - minLng);
    
    const paddingFactor = 0.003;
    const minDelta = 0.003; 
    
    const zoomLevel = Math.max(
      Math.max(latDelta * (1 + paddingFactor), lngDelta * (1 + paddingFactor)),
      minDelta
    );
    
    return {
      midLat,
      midLng,
      zoomLevel,
    };
  };

  return (
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


      <View style={styles.mapContainer}>
        <MapView
          style={styles.innerMap}
          region={mapRegion}
          scrollEnabled={false}
          zoomEnabled={false}
        >
          <Polyline coordinates={parsedCoords} strokeWidth={4} strokeColor="#FACC15" />
        </MapView>
      </View>

      <View style={styles.stats}>
        <View className="flex-column w-[40%]">
          <Text style={styles.statTitle}>Time</Text>
          <Text style={styles.stat}>{formatTime(Number(time))}</Text>
          <Text style={styles.statBottom}>hh:mm:ss</Text>
        </View>
        <View className="flex-column w-[25%]">
          <Text style={styles.statTitle}>Distance</Text>
          <Text style={styles.stat}>{(Number(distance) / 1000).toFixed(2)}</Text>
          <Text style={styles.statBottom}>km</Text>
        </View>
        <View className="flex-column w-[28%]">
          <Text style={styles.statTitle}>Pace</Text>
          <Text style={styles.stat}>{formatPace(Number(pace))}</Text>
          <Text style={styles.statBottom}>min/km</Text>
        </View>
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
  );
};

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const formatPace = (paceMinPerKm: number) => {
  if (!isFinite(paceMinPerKm) || paceMinPerKm <= 0) return "--:--";
  const mins = Math.floor(paceMinPerKm);
  const secs = Math.floor((paceMinPerKm - mins) * 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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

export default SessionSummary;