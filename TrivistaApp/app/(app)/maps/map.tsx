import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as Location from "expo-location";
import { ArrowLeft, Info, Bike, Play, PencilRuler, Volume2 } from "lucide-react-native";
import { useRouter } from "expo-router";
import CustomAlert from "@/components/CustomAlert";
import { useSession } from "@/context";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase-db";

const MapScreen = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertVisible, setAlertVisible] = useState(false);
  const [trainingData, setTrainingData] = useState(null);
  const [selectedType, setSelectedType] = useState("run");
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { user } = useSession();

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Permission to access location was denied");
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      setLocation(currentLocation);
      setRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const fetchTraining = async () => {
      try {
        const docRef = doc(db, "UserStartDate", user.uid);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return;
        const { startDate: startStr } = snap.data();
        const [day, month, year] = startStr.split("-").map(Number);
        const start = new Date(Date.UTC(year, month - 1, day));
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
        const allTrainingsSnap = await getDocs(collection(db, "Training"));
        const allTrainings = allTrainingsSnap.docs.map((d) => d.data());
        const todayTraining = allTrainings.find((t) => t.day === diff + 1);
        setTrainingData(todayTraining);
      } catch (err) {
        console.error("Failed to load training", err);
      }
    };
    if (user) fetchTraining();
  }, [user]);

  const centerMap = () => {
    if (mapRef.current && location) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  if (loading || !region) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FACC15" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Top navigation */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="white" size={28} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>TRAINING</Text>
        <TouchableOpacity onPress={() => setAlertVisible(true)}>
          <Info color="white" size={28} />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        region={region}
        showsUserLocation={true}
      >
        <Marker
          coordinate={{
            latitude: location?.coords.latitude ?? 0,
            longitude: location?.coords.longitude ?? 0,
          }}
          title="You started here"
        />
      </MapView>

      {/* Center map button */}
      <TouchableOpacity style={styles.centerButton} onPress={centerMap}>
        <Text style={{ color: "#1E1E1E", fontFamily: "Bison", fontSize: 16, letterSpacing: 1.5 }}>Center</Text>
      </TouchableOpacity>

      {/* Bottom bar with icons */}
      <View style={styles.bottomBar}>
        <View style={styles.navButtonContainer}>
          <TouchableOpacity style={styles.iconButton}>
            <PencilRuler color="#1E1E1E" size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.iconGroup}>
          <TouchableOpacity onPress={() => setSelectedType("bike")}>
            <Text style={{ fontSize: 22, color: selectedType === "bike" ? "#FACC15" : "white", fontFamily: "Bison" }}>BIKE</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelectedType("run")}>
            <Text style={{ fontSize: 22, color: selectedType === "run" ? "#FACC15" : "white", fontFamily: "Bison" }}>RUN</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelectedType("swim")}>
            <Text style={{ fontSize: 22, color: selectedType === "swim" ? "#FACC15" : "white", fontFamily: "Bison" }}>SWIM</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.navButtonContainer}>
          <TouchableOpacity style={styles.iconButton}>
            <Volume2 color="#1E1E1E" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Play button */}
      <TouchableOpacity style={styles.playButton}>
        <Play color="#1E1E1E" size={28} />
      </TouchableOpacity>

      {/* Alert for training details */}
      <CustomAlert
        visible={alertVisible}
        title={trainingData?.title || "Training of the Day"}
        message={trainingData?.description || "No training data available."}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
  },
  centerButton: {
    position: "absolute",
    bottom: 155,
    right: 25,
    backgroundColor: "#FACC15",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5,
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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  topBarTitle: {
    fontSize: 25,
    fontFamily: "Bison",
    color: "#FACC15",
    letterSpacing: 1.5,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: "#1E1E1E",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 25,
    alignItems: "flex-start",
  },
  navButtonContainer: {
    height: 40,
    marginTop: 15,
    justifyContent: "center",
  },
  iconGroup: {
    flexDirection: "row",
    gap: 20,
    marginTop: 15,
  },
  iconButton: {
    backgroundColor: "#FACC15",
    padding: 8,
    borderRadius: 8,
  },
  playButton: {
    position: "absolute",
    bottom: 22,
    alignSelf: "center",
    backgroundColor: "#FACC15",
    padding: 16,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default MapScreen;