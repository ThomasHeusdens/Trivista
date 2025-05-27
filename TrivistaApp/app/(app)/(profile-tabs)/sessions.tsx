/**
 * Displays a scrollable list of the user's training sessions, filtered by type (run, bike, swim).
 * Each session includes stats (time, distance, pace), a map preview (if GPS data is available),
 * and contextual metadata like city, date, and user-reported feeling.
 *
 * Sessions are fetched from Firestore and displayed using dynamic layout components.
 * @component
 */
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

/**
 * Formats a time value (in seconds) into a `hh:mm:ss` string.
 *
 * @param {number} seconds - Total seconds to format.
 * @returns {string} Formatted time string.
 */
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Converts a decimal pace value (min/km) into a `mm:ss` string.
 *
 * @param {number} paceMinPerKm - Pace in minutes per kilometer.
 * @returns {string} Formatted pace string.
 */
const formatPace = (paceMinPerKm: number): string => {
  if (!isFinite(paceMinPerKm) || paceMinPerKm <= 0) return "--:--";
  const mins = Math.floor(paceMinPerKm);
  const secs = Math.floor((paceMinPerKm - mins) * 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Sessions
 *
 * React component that renders a list of past training sessions with optional filtering.
 * Shows map previews for GPS-enabled sessions and allows platform-specific session filtering via modal or picker.
 *
 * @returns {React.JSX.Element} Rendered Sessions screen.
 */
const Sessions = (): React.JSX.Element => {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [selectedType, setSelectedType] = useState("all");
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  
  const [sessionCoordData, setSessionCoordData] = useState({});

  const typeOptions = [
    { label: "All Sessions", value: "all" },
    { label: "Run", value: "run" },
    { label: "Bike", value: "bike" },
    { label: "Swim", value: "swim" },
  ];

  /**
   * Calculates the center point and zoom level to fit all given coordinates.
   *
   * @param {Array<{ latitude: number, longitude: number }>} points - Array of GPS coordinates.
   * @returns {{
   *   midLat: number,
   *   midLng: number,
   *   zoomLevel: number
   * }} Map viewport data.
   */
  const calculateCoordinateData = (points: Array<{ latitude: number; longitude: number; }>): {
    midLat: number;
    midLng: number;
    zoomLevel: number;
  } => {
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

  /**
   * Fetches training sessions for the current user from Firestore,
   * calculates coordinate metadata for GPS-enabled sessions,
   * and populates session-related state for rendering and filtering.
   *
   * Runs once on mount.
   */
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
        
        const coordData = {};
        data.forEach((session, index) => {
          if (session.coords && session.coords.length > 0) {
            coordData[index] = calculateCoordinateData(session.coords);
          }
        });
        
        setSessionCoordData(coordData);
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
          filteredSessions.map((session, idx) => {
            const sessionData = sessionCoordData[sessions.indexOf(session)];
            
            return (
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
                  {session.coords && session.coords.length > 0 && sessionData ? (
                    <MapView
                      style={{ width: '100%', height: '100%' }}
                      region={{
                        latitude: sessionData.midLat,
                        longitude: sessionData.midLng,
                        latitudeDelta: sessionData.zoomLevel,
                        longitudeDelta: sessionData.zoomLevel,
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
                  <View style={styles.statBlockTime}>
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
            );
          })
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
    backgroundColor: "rgba(255,255,255,0.1)",
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
    width: "29%",
    alignItems: "center",
  },
  statBlockTime: {
    width: "40%",
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