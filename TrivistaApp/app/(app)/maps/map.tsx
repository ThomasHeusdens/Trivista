/**
 * Main workout tracking screen that displays a live map view of the user's path.
 * Includes support for real-time GPS tracking, distance and pace calculation,
 * voice feedback on progress, pause/resume handling, and session summary navigation.
 * @module
 */
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import MapView, { PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { ArrowLeft, Info, Play, Pause, StopCircle, PencilLine, Volume2, VolumeX } from "lucide-react-native";
import { useRouter } from "expo-router";
import CustomAlert from "@/components/CustomAlert";
import { useSession } from "@/context";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase-db";
import * as geolib from 'geolib';
import * as Speech from "expo-speech";
import * as TaskManager from "expo-task-manager";
import { LOCATION_TASK_NAME } from "@/lib/location-task";

/**
 * Main training session screen that allows users to track outdoor activities such as running, biking, or swimming.
 * Handles various session states: not started, running, paused, and completed.
 *
 * @returns {React.JSX.Element} Interactive training screen with map and controls.
 */

const MapScreen = (): React.JSX.Element => {
  const [location, setLocation] = useState(null);
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertVisible, setAlertVisible] = useState(false);
  const [trainingData, setTrainingData] = useState(null);
  const [selectedType, setSelectedType] = useState("run");
  const [tracking, setTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [distance, setDistance] = useState(0);
  const [pace, setPace] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [routeCoords, setRouteCoords] = useState([]);
  const [city, setCity] = useState("");
  const pauseDuration = useRef(0);
  const lastResumeTimestamp = useRef<number | null>(null);

  const [voiceOn, setVoiceOn] = useState(true);
  const spokenKilometers = useRef(new Set<number>());

  const router = useRouter();
  const mapRef = useRef(null);
  const watchId = useRef(null);
  const lastLocation = useRef(null);
  const pausedTime = useRef(null);
  const visualWatchId = useRef(null);
  const { user } = useSession();

  /**
   * Uses text-to-speech to announce progress updates during training.
   * Announces the completed kilometer number, total time elapsed, and current pace.
   *
   * @param {number} km - The completed kilometer to announce.
   * @param {number} timeSec - Total elapsed time in seconds.
   * @param {number} paceMinPerKm - Current pace in minutes per kilometer.
   *
   * @returns {void}
   */
  const speakUpdate = (km: number, timeSec: number, paceMinPerKm: number): void => {
    try {
      const minutes = Math.floor(timeSec / 60);
      const seconds = timeSec % 60;
      const paceMin = Math.floor(paceMinPerKm);
      const paceSec = Math.floor((paceMinPerKm - paceMin) * 60);

      const paceFormatted = `${paceMin} minutes and ${paceSec} seconds`;
      
      const message = `Kilometer ${km} completed. Total time: ${minutes} minutes and ${seconds} seconds. Current pace: ${paceFormatted} per kilometer`;
      
      Speech.speak(message, { 
        rate: 0.95,
        pitch: 1.0,
        onError: (error) => console.error("Speech error:", error),
        onDone: () => console.log("Voice announcement completed")
      });
    } catch (error) {
      console.error("Failed to produce voice update:", error);
    }
  };

  /**
   * Requests foreground location permission and fetches the user's current position
   * to center the map initially.
   */
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

  /**
   * When not actively tracking, follows the user's location on the map
   * with periodic updates every few seconds.
   */
  useEffect(() => {
    let idleWatcher;

    const followUser = async () => {
      idleWatcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 3000,
          distanceInterval: 10,
        },
        (loc) => {
          if (!tracking) {
            setLocation(loc);
            mapRef.current?.animateToRegion({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }
        }
      );
    };

    followUser();

    return () => {
      if (idleWatcher) idleWatcher.remove();
    };
  }, [tracking]);

  /**
   * Fetches the current day’s training data from Firestore based on the user's start date.
   */
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

  /**
   * Manages starting, pausing, and stopping both visual and background tracking
   * depending on the current tracking and pause state.
   */
  useEffect(() => {
    if (tracking && !isPaused) {
      if (!startTime) {
        const now = new Date();
        setStartTime(now);
        lastResumeTimestamp.current = now.getTime();
        pauseDuration.current = 0;
      }

      startLocationTracking();
    } else if (isPaused) {
      stopLocationTracking();
    } else {
      stopAllTracking();
    }

    return () => {
      stopAllTracking();
    };
  }, [tracking, isPaused]);

  /**
   * Starts background GPS tracking and updates total distance covered.
   * Ensures permissions are granted and background task is active.
   * @async
   * @return {Promise<void>}
   */
  const startLocationTracking = async (): Promise<void> => {
    try {
      startVisualTracking();

      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Background permission not granted");
        return;
      }

      const isTaskDefined = await TaskManager.isTaskDefined(LOCATION_TASK_NAME);
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);

      if (!hasStarted) {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 5000,
          distanceInterval: 5,
          showsBackgroundLocationIndicator: true,
          pausesUpdatesAutomatically: false,
          foregroundService: {
            notificationTitle: "TRIVISTA",
            notificationBody: "Tracking your session in background.",
            notificationColor: "#FACC15",
          },
        });
      }
      
      if (!isPaused) {
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          (loc) => {
            const { latitude, longitude } = loc.coords;
            
            if (lastLocation.current) {
              const dx = geolib.getDistance(
                { latitude: lastLocation.current.latitude, longitude: lastLocation.current.longitude },
                { latitude, longitude }
              );

              if (dx > 1) {
                console.log(`Distance increment: ${dx} meters`);
                setDistance((prev) => prev + dx);
              }
            }

            lastLocation.current = { latitude, longitude };
          }
        );

        watchId.current = subscription;
      }
    } catch (error) {
      console.error("Error starting location tracking:", error);
    }
  };

  /**
   * Starts front-end map updates (with polylines) and centers the camera on movement.
   * @async
   * @return {Promise<void>}
   */
  const startVisualTracking = async (): Promise<void> => {
    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (loc) => {
          const { latitude, longitude } = loc.coords;
          const newCoord = { latitude, longitude };

          setLocation(loc);
          setRouteCoords((prev) => [...prev, newCoord]);

          mapRef.current?.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      );

      visualWatchId.current = subscription;
    } catch (error) {
      console.error("Error starting visual tracking:", error);
    }
  };

  /**
   * Stops active location tracking for distance calculation.
   */
  const stopLocationTracking = () => {
    if (watchId.current) {
      watchId.current.remove();
      watchId.current = null;
    }
  };

  /**
   * Halts both background and visual tracking activities safely,
   * including location task cleanup.
   * @async
   * @return {Promise<void>}
   */
  const stopAllTracking = async (): Promise<void> => {
    stopLocationTracking();
    if (visualWatchId.current) {
      visualWatchId.current.remove();
      visualWatchId.current = null;
    }

    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      } else {
        console.log("Background task was never started, skipping stop.");
      }
    } catch (error) {
      console.warn("Couldn't stop background task — it may not have been registered:", error.message);
    }
  };

  /**
   * Recalculates current pace (minutes/km) whenever time or distance updates.
   */
  useEffect(() => {
    if (elapsedTime > 0 && distance > 0) {
      const paceValue = (elapsedTime / 60) / (distance / 1000);
      if (isFinite(paceValue) && paceValue > 0) {
        setPace(paceValue);
      }
    }
  }, [elapsedTime, distance]);

  /**
   * Announces each completed kilometer via voice if enabled and not paused.
   * Avoids repeating announcements by caching completed kilometers.
   */
  useEffect(() => {
    if (!voiceOn || !tracking || isPaused) return;

    const currentKilometers = distance / 1000;
    const lastCompletedKilometer = Math.floor(currentKilometers);
    
    if (lastCompletedKilometer > 0 && !spokenKilometers.current.has(lastCompletedKilometer)) {
      if (currentKilometers >= lastCompletedKilometer + 0.01) {
        console.log(`Announcing kilometer ${lastCompletedKilometer}`);
        spokenKilometers.current.add(lastCompletedKilometer);
        
        try {
          const currentPace = elapsedTime > 0 ? (elapsedTime / 60) / (distance / 1000) : 0;
          speakUpdate(lastCompletedKilometer, elapsedTime, currentPace);
        } catch (error) {
          console.error("Error during voice announcement:", error);
        }
      }
    }
  }, [distance, tracking, isPaused, voiceOn]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  /**
   * Formats time and pace for display in hh:mm:ss and mm:ss respectively.
   */
  const formatPace = (paceMinPerKm) => {
    if (!isFinite(paceMinPerKm) || paceMinPerKm <= 0) return "--:--";

    const mins = Math.floor(paceMinPerKm);
    const secs = Math.floor((paceMinPerKm - mins) * 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Gets user's city from geolocation to attach it to manually logged sessions.
   * @async
   * @return {Promise<string|null>} Resolved city name or null if failed.
   */
  const setCityForManualLogging = async (): Promise<string | null> => {
    try {
      const initialPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      if (initialPosition) {
        const { latitude, longitude } = initialPosition.coords;
        lastLocation.current = { latitude, longitude };

        const geoData = await Location.reverseGeocodeAsync({ latitude, longitude });

        if (geoData.length > 0) {
          const { city: cityName, region, country } = geoData[0];
          const resolvedCity = `${cityName || region}, ${country}`;
          setCity(resolvedCity); 
          return resolvedCity;   
        }
      }
    } catch (error) {
      console.error("Failed to get initial position:", error);
    }

    return null;
  };

  /**
   * Uses `requestAnimationFrame` to keep a smooth and accurate update of elapsed time,
   * even across pause/resume cycles.
   */
  useEffect(() => {
    let animationFrame;

    const update = () => {
      if (tracking && !isPaused && startTime) {
        const now = Date.now();
        const totalPaused = pauseDuration.current;
        const activeTime = now - startTime.getTime() - totalPaused;
        setElapsedTime(Math.floor(activeTime / 1000));
      }

      animationFrame = requestAnimationFrame(update);
    };

    if (tracking && !isPaused) {
      animationFrame = requestAnimationFrame(update);
    }

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [tracking, isPaused, startTime]);

  /**
   * Navigates the user to the manual logging screen with geolocation city data.
   * @async
   * @return {Promise<void>}
   */
  const handleManualLogPress = async (): Promise<void> => {
    const resolvedCity = await setCityForManualLogging();

    router.push({
      pathname: "/(app)/session/session-logging",
      params: {
        type: selectedType,
        city: resolvedCity,
      },
    });
  };

  /**
   * Clears spoken kilometer history and stops any ongoing speech.
   * @async
   * @return {Promise<void>}
   */
  const resetVoiceTracking = async (): Promise<void> => {
    spokenKilometers.current.clear();
    
    try {
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        Speech.stop();
      }
    } catch (error) {
      console.error("Error checking speech status:", error);
    }
  };

  /**
   * Initializes all tracking states and resets voice and distance metrics.
   * Also sets the city for the session summary screen.
   * @async
   * @return {Promise<void>}
   */
  const startActivity = async (): Promise<void> => {
    setElapsedTime(0);
    setDistance(0);
    setPace(0);
    setRouteCoords([]);
    setIsPaused(false);
    await resetVoiceTracking();
    setStartTime(new Date());
    pauseDuration.current = 0;
    lastResumeTimestamp.current = Date.now();


    try {
      const initialPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation
      });

      if (initialPosition) {
        const { latitude, longitude } = initialPosition.coords;
        lastLocation.current = { latitude, longitude };
        setLocation(initialPosition);
        
        const geoData = await Location.reverseGeocodeAsync({ latitude, longitude });

        if (geoData.length > 0) {
          const { city: cityName, region, country } = geoData[0];
          setCity(`${cityName || region}, ${country}`);
          console.log("Start city:", `${cityName || region}, ${country}`);
        }
      }
    } catch (error) {
      console.error("Failed to get initial position:", error);
    }

    setTracking(true);
  };

  /**
   * Toggles tracking pause state. 
   * Accumulates paused time to keep accurate elapsed time.
   * @async
   * @return {Promise<void>}
   */
  const pauseActivity = (): Promise<void> => {
    setIsPaused(true);
    pausedTime.current = Date.now();
    stopLocationTracking();
    console.log("Activity paused");
  };

  /**
   * Resumes from last known location.
   * Accumulates paused time to keep accurate elapsed time.
   * @async
   * @return {Promise<void>}
   */
  const resumeActivity = async (): Promise<void> => {
    try {
      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation
      });

      if (currentPosition) {
        const { latitude, longitude } = currentPosition.coords;
        lastLocation.current = { latitude, longitude };
        setLocation(currentPosition);
        console.log("Resuming from location:", lastLocation.current);
      }
    } catch (error) {
      console.error("Failed to get position for resume:", error);
    }

    const now = Date.now();
    if (pausedTime.current) {
      pauseDuration.current += now - pausedTime.current;
    }
    lastResumeTimestamp.current = now;
    pausedTime.current = null;

    setIsPaused(false);
    startLocationTracking();
    console.log("Activity resumed");
  };

  /**
   * Ends the session, stops all tracking, resets states,
   * and navigates to the session summary with stats and route data.
   * @async
   * @return {Promise<void>}
   */
  const stopActivity = async (): Promise<void> => {
    const finalTime = elapsedTime;
    const finalDistance = distance;
    const finalPace = pace;
    const finalCoords = [...routeCoords]; 

    setTracking(false);
    setIsPaused(false);
    setStartTime(null);
    stopAllTracking();
    await resetVoiceTracking();

    router.push({
      pathname: "/(app)/session/session-summary",
      params: {
        time: finalTime.toString(),
        distance: finalDistance.toString(),
        pace: finalPace.toString(),
        coords: JSON.stringify(finalCoords),
        type: selectedType,
        city: city,
      },
    });

    setTimeout(() => {
      setElapsedTime(0);
      setDistance(0);
      setPace(0);
      setRouteCoords([]);
    }, 500);
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
      {!tracking && (
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft color="white" size={28} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>TRAINING</Text>
          <TouchableOpacity onPress={() => setAlertVisible(true)}>
            <Info color="white" size={28} />
          </TouchableOpacity>
        </View>
      )}

      {tracking && (
        <View style={styles.topBar2}>
          <Text style={styles.topBarTitle}>GO FOR IT!</Text>
        </View>
      )}

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        showsUserLocation={true}
      >
        <Polyline coordinates={routeCoords} strokeWidth={5} strokeColor="#FACC15" />
      </MapView>

      {tracking && (
        <View style={styles.trackingBar}>
          <View style={styles.stats}>
            <View className="flex-column w-[40%]">
              <Text style={styles.statTitle}>Time</Text>
              <Text style={styles.stat}>{formatTime(elapsedTime)}</Text>
              <Text style={styles.statBottom}>hh:mm:ss</Text>
            </View>
            <View className="flex-column w-[25%]">
              <Text style={styles.statTitle}>Distance</Text>
              <Text style={styles.stat}>{(distance / 1000).toFixed(2)}</Text>
              <Text style={styles.statBottom}>km</Text>
            </View>
            <View className="flex-column w-[28%]">
              <Text style={styles.statTitle}>Pace</Text>
              <Text style={styles.stat}>{formatPace(pace)}</Text>
              <Text style={styles.statBottom}>min/km</Text>
            </View>
          </View>
          {isPaused && (
            <Text style={[styles.statText, styles.pausedText]}>PAUSED</Text>
          )}
        </View>
      )}

      <View style={[styles.bottomBar, tracking ? styles.bottomBarTracking : styles.bottomBarDefault]}>
        {tracking ? (
          <>
            <TouchableOpacity 
              style={styles.pauseButton} 
              onPress={isPaused ? resumeActivity : pauseActivity}
            >
              {isPaused ? (
                <Play color="#1E1E1E" size={28} />
              ) : (
                <Pause color="#1E1E1E" size={28} />
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.stopButton} onPress={stopActivity}>
              <StopCircle color="#1E1E1E" size={28} />
            </TouchableOpacity>
            <View style={styles.navButtonContainer}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setVoiceOn(prev => !prev)}
              >
                {voiceOn ? (
                  <Volume2 color="#1E1E1E" size={24} />
                ) : (
                  <VolumeX color="#1E1E1E" size={24} />
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.navButtonContainer}>
              <TouchableOpacity style={styles.iconButton} onPress={handleManualLogPress}>
                <PencilLine color="#1E1E1E" size={24} />
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
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setVoiceOn(prev => !prev)}
              >
                {voiceOn ? (
                  <Volume2 color="#1E1E1E" size={24} />
                ) : (
                  <VolumeX color="#1E1E1E" size={24} />
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {!tracking && (
        <TouchableOpacity style={styles.playButton} onPress={startActivity}>
          <Play color="#1E1E1E" size={28} />
        </TouchableOpacity>
      )}

      <CustomAlert
        visible={alertVisible}
        title={trainingData?.title || "Training of the Day"}
        message={trainingData?.description || "No training data available."}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
};

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  map: {
    flex: 1,
    marginTop: 100,
    marginBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
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
  topBar2: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: "#1E1E1E",
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  topBarTitle: {
    fontSize: 25,
    fontFamily: "Bison",
    color: "#FACC15",
    textAlign: "center",
    letterSpacing: 1.5,
  },
  stats: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
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
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1E1E1E",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 25,
    alignItems: "flex-start",
  },
  bottomBarTracking: {
    height: 100,
  },
  bottomBarDefault: {
    height: 140,
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
  stopButton: {
    position: "absolute",
    right: "38%",
    bottom: 22,
    backgroundColor: "#FACC15",
    padding: 16,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pauseButton: {
    position: "absolute",
    left:"38%",
    bottom: 22,
    backgroundColor: "#FACC15",
    padding: 16,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5,
  },
  trackingBar: {
    position: "absolute",
    bottom: 115,
    left: 25,
    right: 25,
    backgroundColor: "#1E1E1E",
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  statText: {
    color: "white",
    fontFamily: "InterRegular",
    fontSize: 14,
  },
  pausedText: {
    color: "#FACC15",
    fontWeight: "bold",
    position: "absolute",
    backgroundColor: "#1E1E1E",
    padding: 8,
    borderRadius: 10,
    right: 0,
    top: -40,
  },
});

export default MapScreen;