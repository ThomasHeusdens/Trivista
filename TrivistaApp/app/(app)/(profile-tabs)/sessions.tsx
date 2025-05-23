import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
  ActivityIndicator,
} from "react-native";
import MapView, { Polyline } from "react-native-maps";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase-db";
import { getAuth } from "firebase/auth";
import { Picker } from "@react-native-picker/picker";

const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const formatPace = (paceMinPerKm) => {
  if (!isFinite(paceMinPerKm) || paceMinPerKm <= 0) return "--:--";
  const mins = Math.floor(paceMinPerKm);
  const secs = Math.floor((paceMinPerKm - mins) * 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [selectedType, setSelectedType] = useState("all");
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);

  const typeOptions = [
    { label: "All Sessions", value: "all" },
    { label: "Run", value: "run" },
    { label: "Bike", value: "bike" },
    { label: "Swim", value: "swim" },
  ];

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const user = getAuth().currentUser;
        if (!user) return;

        const q = query(
          collection(db, "users", user.uid, "trainingSessions"),
          orderBy("timestamp", "desc")
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => doc.data());
        setSessions(data);
        setFilteredSessions(data); 
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
      } finally {
        setSessionsLoaded(true);
      }
    };

    fetchSessions();
  }, []);

  useEffect(() => {
    if (sessionsLoaded) {
      setLoading(false);
    }
  }, [sessionsLoaded]);

  useEffect(() => {
    if (selectedType === "all") {
      setFilteredSessions(sessions);
    } else {
      setFilteredSessions(sessions.filter(session => session.type === selectedType));
    }
  }, [selectedType, sessions]);

  const screenWidth = Dimensions.get("window").width;
  const mapWidth = screenWidth - 80;

  const typeIcon = {
    run: "🏃", 
    bike: "🚴", 
    swim: "🏊", 
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1E1E1E" }}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  return (
    <>
      <ImageBackground
        source={require("@/assets/images/background.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS === "ios") setTypeModalVisible(true);
            }}
            style={styles.filterButton}
          >
            {Platform.OS === "ios" ? (
              <Text style={styles.filterButtonText}>
                {typeOptions.find((t) => t.value === selectedType)?.label || "All Sessions"}
              </Text>
            ) : (
              <Picker
                selectedValue={selectedType}
                onValueChange={(itemValue) => setSelectedType(itemValue)}
                style={{ color: "#fff", width: "100%" }}
                dropdownIconColor="#FACC15"
              >
                {typeOptions.map((opt) => (
                  <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                ))}
              </Picker>
            )}
          </TouchableOpacity>
        </View>

        <Modal transparent animationType="fade" visible={typeModalVisible}>
          <TouchableOpacity
            onPress={() => setTypeModalVisible(false)}
            style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000000aa" }}
          >
            <View style={{ backgroundColor: "#1E1E1E", borderRadius: 10, width: "80%", borderWidth: 1, borderColor: "#FACC15" }}>
              <FlatList
                data={typeOptions}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedType(item.value);
                      setTypeModalVisible(false);
                    }}
                    style={{ padding: 15, borderBottomWidth: 1, borderBottomColor: "rgba(250, 204, 21, 0.3)" }}
                  >
                    <Text style={{ fontSize: 16, color: "white", fontFamily: "InterRegular" }}>{item.label}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        {filteredSessions.length > 0 ? (
          filteredSessions.map((session, idx) => (
            <View key={idx} style={styles.sessionBox}>
              <View style={styles.headerRow}>
                <Text style={styles.typeText}>
                  {typeIcon[session.type]}
                </Text>
                <Text style={styles.cityText}>
                  {session.city}, {new Date(session.createdAt).toLocaleString()}
                </Text>
                <Text style={styles.feelingText}>{session.feeling}</Text>
              </View>
              <Text style={styles.sessionName}>{session.name}</Text>
              <View style={{ 
                width: mapWidth, 
                height: 200, 
                borderRadius: 10, 
                overflow: 'hidden',
                marginBottom: 10,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
              }}>
                {session.coords && session.coords.length > 0 ? (
                  <MapView
                    style={{ width: '100%', height: '100%' }}
                    region={{
                      latitude: session.coords[0].latitude,
                      longitude: session.coords[0].longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                  >
                    <Polyline coordinates={session.coords} strokeWidth={4} strokeColor="#FACC15" />
                  </MapView>
                ) : (
                  <Text style={{ color: "#ccc", fontFamily: "InterRegular", padding: 20, textAlign: "center" }}>
                    No GPS data available. This session was manually logged.
                  </Text>
                )}
              </View>
              <View style={styles.stats}>
                <View style={styles.statBlock}>
                  <Text style={styles.statTitle}>Time</Text>
                  <Text style={styles.stat}>{formatTime(session.time)}</Text>
                  <Text style={styles.statBottom}>hh:mm:ss</Text>
                </View>
                <View style={styles.statBlock}>
                  <Text style={styles.statTitle}>Distance</Text>
                  <Text style={styles.stat}>{session.distance}</Text>
                  <Text style={styles.statBottom}>km</Text>
                </View>
                <View style={styles.statBlock}>
                  <Text style={styles.statTitle}>Pace</Text>
                  <Text style={styles.stat}>{formatPace(session.pace)}</Text>
                  <Text style={styles.statBottom}>min/km</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noSessionsContainer}>
            <Text style={styles.noSessionsText}>No training sessions yet</Text>
          </View>
        )}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
    backgroundColor: "#1E1E1E",
  },
  container: {
    paddingTop: 122,
    paddingBottom: 80,
    paddingHorizontal: 25,
    alignItems: "center",
  },
  filterContainer: {
    width: "100%",
    marginBottom: 20,
    zIndex: 10,
  },
  filterButton: {
    borderWidth: 1,
    borderColor: "#FACC15",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.1)",
    width: "100%",
    height: Platform.OS === "ios" ? 50 : 50,
    justifyContent: "center",
  },
  filterButtonText: {
    color: "white",
    padding: 12,
    fontFamily: "InterRegular",
    textAlign: "center",
  },
  sessionBox: {
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    padding: 10,
    marginBottom: 30,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FACC15",
  },
  headerRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 8,
  },
  cityText: {
    fontFamily: "InterRegular",
    color: "#ccc",
    fontSize: 12,
    textAlign: "center",
    flex: 1,
    marginHorizontal: 10,
  },
  typeText: {
    flexShrink: 0,
  },
  feelingText: {
    fontFamily: "InterRegular",
    color: "white",
    fontSize: 12,
    flexShrink: 0,
  },
  sessionName: {
    fontFamily: "Bison",
    fontSize: 20,
    color: "white",
    marginBottom: 10,
    letterSpacing: 1.5,
    textAlign: "center",
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  statBlock: {
    width: "35%",
    alignItems: "center",
  },
  statTitle: {
    fontSize: 15,
    color: "white",
    fontFamily: "Bison",
    marginBottom: 5,
  },
  stat: {
    fontSize: 30,
    color: "white",
    fontFamily: "Bison",
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 10,
    padding: 10,
    letterSpacing: 1.5,
    textAlign: "center",
  },
  statBottom: {
    fontSize: 14,
    color: "#ccc",
    fontFamily: "InterRegular",
    textAlign: "center",
  },
  noSessionsContainer: {
    marginTop: 20,
  },
  noSessionsText: {
    color: "white",
    fontSize: 18,
    fontFamily: "InterRegular",
    textAlign: "center",
  },
});

export default Sessions;