import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Platform, Modal, FlatList } from "react-native";
import React, { useState } from "react";
import MapView, { Polyline } from "react-native-maps";
import { useLocalSearchParams } from "expo-router";
import { Picker } from "@react-native-picker/picker";

const SessionSummary = () => {
  const { time, distance, pace, coords, type } = useLocalSearchParams();
  const [selectedType, setSelectedType] = useState(type || "");
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const parsedCoords = JSON.parse(coords || "[]");

  const typeOptions = [
    { label: "Run", value: "run" },
    { label: "Bike", value: "bike" },
    { label: "Swim", value: "swim" },
  ];

  return (
    <View style={styles.container}>
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

      <MapView
        style={styles.map}
        region={{
          latitude: parsedCoords[0]?.latitude || 0,
          longitude: parsedCoords[0]?.longitude || 0,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
      >
        <Polyline coordinates={parsedCoords} strokeWidth={4} strokeColor="#FACC15" />
      </MapView>

      <View style={styles.stats}>
        <Text style={styles.stat}>⏱️ Total Time: {formatTime(Number(time))}</Text>
        <Text style={styles.stat}>📏 Distance: {(Number(distance) / 1000).toFixed(2)} km</Text>
        <Text style={styles.stat}>⚡ Avg Pace: {formatPace(Number(pace))} min/km</Text>
      </View>
    </View>
  );
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
    paddingTop: 50,
    alignItems: "center",
  },
  map: {
    width: width * 0.9,
    height: 300,
    borderRadius: 10,
    marginBottom: 20,
  },
  stats: {
    paddingHorizontal: 20,
  },
  stat: {
    fontSize: 16,
    color: "#FACC15",
    fontFamily: "InterRegular",
    marginVertical: 8,
  },
});

export default SessionSummary;