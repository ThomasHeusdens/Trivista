/**
 * Main training screen that displays today's workout (or recovery if completed),
 * tracks progress through a 12-week triathlon program, and renders daily or post-program videos.
 * Handles week navigation, training data display, and conditional states (before start, in progress, after completion).
 * @module
 */
import { useSession } from "@/context";
import { db } from "@/lib/firebase-db";
import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";
import {
  LandPlot,
  Timer,
  Trophy
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import CustomTrainAlert from "@/components/CustomTrainingAlert";
import CustomAlert from "@/components/CustomAlert";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Core component of the training tab. Calculates which day the user is on,
 * loads appropriate training data from Firestore, and shows training metrics
 * and video guidance. Also displays progress across the 12-week program.
 *
 * @returns {React.JSX.Element} The UI for the training screen.
 */
const Train = (): React.JSX.Element => {
  const { user } = useSession();
  const [appDay, setAppDay] = useState(0);
  const [trainingDay, setTrainingDay] = useState(null);
  const [trainingData, setTrainingData] = useState(null);
  const [trainingEndDay, setTrainingEndDay] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [allTrainings, setAllTrainings] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [trainingVideos, setTrainingVideos] = useState([]);
  const [randomVideos, setRandomVideos] = useState([]);
  const [isTrainingCompleted, setIsTrainingCompleted] = useState(false);
  const [randomTrainingVideo, setRandomTrainingVideo] = useState(null);
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;

  const [alertVisible, setAlertVisible] = useState(false);

  const progress = useSharedValue(0);

  /**
   * Calculates which day of the 84-day training program the user is on,
   * and sets current week, appDay, and training progress.
   * Also updates the progress bar value using Reanimated.
   */
  useEffect(() => {
    const fetchTrainingDay = async () => {
      if (!user) return;
      try {
        const createdAt = new Date(user.metadata.creationTime);
        createdAt.setUTCHours(0, 0, 0, 0);
        const colRef = doc(db, "users", user.uid, "startDate", user.displayName || "date");
        const snap = await getDoc(colRef);
        if (snap.empty) return;
        
        const { startDate: startStr } = snap.data();
        const [day, month, year] = startStr.split("-").map(Number);
        const start = new Date(Date.UTC(year, month - 1, day));
        setStartDate(start);
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
        
        if (diff >= 84) {
          setIsTrainingCompleted(true);
          setTrainingDay(85); 
          setSelectedDay(85);
        } else if (diff < 0) {
          setTrainingDay(null);
        } else {
          setTrainingDay(diff + 1);
          setSelectedDay(diff + 1);
          setCurrentWeek(Math.floor(diff / 7));
        }
        
        const trainingEndDate = new Date(start);
        trainingEndDate.setUTCDate(trainingEndDate.getUTCDate() + 84);
        const daysUntilTrainingEnds = Math.floor(
          (trainingEndDate - createdAt) / (1000 * 60 * 60 * 24)
        );
        setTrainingEndDay(daysUntilTrainingEnds);
        
        const daysSinceCreation = Math.floor(
          (today - createdAt) / (1000 * 60 * 60 * 24)
        ) + 1;
        setAppDay(daysSinceCreation);
        
        if (daysSinceCreation >= daysUntilTrainingEnds) {
          progress.value = withTiming(1, { duration: 800 });
        } else {
          progress.value = withTiming(daysSinceCreation / daysUntilTrainingEnds, { duration: 800 });
        }
      } catch (err) {
        console.error("Error getting start date:", err);
      }
    };

    fetchTrainingDay();
  }, [user]);

  /**
   * Fetches all training sessions from Firestore and sets the current day’s data.
   */
  useEffect(() => {
    const fetchTraining = async () => {
      try {
        const colSnap = await getDocs(collection(db, "Training"));
        const all = colSnap.docs.map((doc) => doc.data());
        setAllTrainings(all);
        if (trainingDay && trainingDay <= 84) {
          const todayTraining = all.find((t) => t.day === trainingDay);
          setTrainingData(todayTraining);
        }
      } catch (err) {
        console.error("Failed to load training", err);
      }
    };
    fetchTraining();
  }, [trainingDay]);

  /**
   * When user taps a different day in the week selector, update the training view accordingly.
   */
  useEffect(() => {
    if (selectedDay && selectedDay <= 84 && allTrainings.length > 0) {
      const selected = allTrainings.find((t) => t.day === selectedDay);
      setTrainingData(selected);
    }
  }, [selectedDay, allTrainings]);

  /**
   * Loads daily training videos and random fallback videos.
   * If user has completed the program, fetches a new random daily video from storage.
   */
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const trainingSnap = await getDocs(collection(db, "TrainingVideos"));
        const randomSnap = await getDocs(query(collection(db, "RandomVideos"), orderBy("iframe")));
        
        const trainingVideosData = trainingSnap.docs.map((doc) => doc.data());
        setTrainingVideos(trainingVideosData);
        
        const randomVideosData = randomSnap.docs.map((doc) => doc.data());
        setRandomVideos(randomVideosData);
        
        if (isTrainingCompleted) {
          await fetchOrCreateDailyRandomVideo(trainingVideosData);
        }
      } catch (err) {
        console.error("Failed to fetch videos", err);
      }
    };
    fetchVideos();
  }, [isTrainingCompleted]);

  /**
   * Either retrieves a stored video for the day from AsyncStorage or randomly picks one.
   * Stores the selection so the same video is shown all day.
   *
   * @param {Array} trainingVideosArray - All available training videos.
   */
  const fetchOrCreateDailyRandomVideo = async (trainingVideosArray: Array<any>) => {
    if (!trainingVideosArray || trainingVideosArray.length === 0) return;
    
    try {
      const today = new Date();
      const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const storageKey = `postTrainingVideo_${dateKey}`;
      
      const storedVideo = await AsyncStorage.getItem(storageKey);
      
      if (storedVideo) {
        setRandomTrainingVideo(JSON.parse(storedVideo));
      } else {
        const randomIndex = Math.floor(Math.random() * trainingVideosArray.length);
        const selectedVideo = trainingVideosArray[randomIndex];
        setRandomTrainingVideo(selectedVideo);
        
        await AsyncStorage.setItem(storageKey, JSON.stringify(selectedVideo));
      }
    } catch (err) {
      console.error("Error handling daily random video:", err);
      const randomIndex = Math.floor(Math.random() * trainingVideosArray.length);
      setRandomTrainingVideo(trainingVideosArray[randomIndex]);
    }
  };

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: `${Math.min(progress.value * 100, 100)}%`,
  }));

  /**
   * Determines which video to display:
   * - If before training: show rotating random videos.
   * - If completed: show post-program maintenance video.
   * - If in training: show the video assigned to the selected training day.
   *
   * @returns {React.JSX.Element|null}
   */
  const renderVideo = (): React.JSX.Element | null => {
    if (!user) return null;

    if (trainingDay === null) {
      const createdAt = new Date(user.metadata.creationTime);
      const today = new Date();
      createdAt.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const daysWaiting = Math.floor((today - createdAt) / (1000 * 60 * 60 * 24));
      const index = daysWaiting % randomVideos.length;
      const video = randomVideos[index];
      return video ? (
        <View style={{ height: 200, marginTop: 12, borderRadius: 12, overflow: "hidden" }}>
          <WebView source={{ uri: video.iframe }} style={{ flex: 1 }} allowsInlineMediaPlayback={true} mediaPlaybackRequiresUserAction={false} />
        </View>
      ) : null;
    } 
    else if (isTrainingCompleted && randomTrainingVideo) {
      return (
        <View style={{ height: 200, marginTop: 12, borderRadius: 12, overflow: "hidden" }}>
          <WebView source={{ uri: randomTrainingVideo.iframe }} style={{ flex: 1 }} allowsInlineMediaPlayback={true} mediaPlaybackRequiresUserAction={false} />
        </View>
      );
    } 
    else {
      const video = trainingVideos.find((v) => v.day === selectedDay);
      return video ? (
        <View style={{ height: 200, marginTop: 12, borderRadius: 12, overflow: "hidden" }}>
          <WebView source={{ uri: video.iframe }} style={{ flex: 1 }} allowsInlineMediaPlayback={true} mediaPlaybackRequiresUserAction={false} />
        </View>
      ) : null;
    }
  };

  /**
   * Renders the 7-day week navigator for selecting training days.
   * Disabled once training is completed.
   *
   * @returns {React.JSX.Element|null}
   */
  const renderWeekDays = (): React.JSX.Element | null => {
    if (!startDate || trainingDay === null) return null;
    
    // Don't show week selector after training completion
    if (isTrainingCompleted) return null;
    
    const weekStart = new Date(startDate);
    weekStart.setUTCDate(weekStart.getUTCDate() + currentWeek * 7);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const monthName = weekStart.toLocaleDateString("en-US", { month: "long" });

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setUTCDate(date.getUTCDate() + i);
      const label = date.toLocaleDateString("en-US", { weekday: "short" });
      const number = date.getUTCDate();
      const isToday = date.toDateString() === today.toDateString();
      const dayIndex = Math.floor((date - startDate) / (1000 * 60 * 60 * 24)) + 1;
      const trainingExists = allTrainings.some(
        (t) => t.day === dayIndex && ["run", "bike", "swim", "mix"].includes(t.type)
      );
      days.push(
        <TouchableOpacity
          key={i}
          style={{ alignItems: "center", flex: 1 }}
          onPress={() => setSelectedDay(dayIndex)}
        >
          <Text style={{
            color: isToday ? "#FACC15" : "white",
            fontWeight: selectedDay === dayIndex ? "bold" : "normal",
          }}>{label}</Text>
          <Text style={{
            color: isToday ? "#FACC15" : "white",
            fontSize: 16,
            fontWeight: selectedDay === dayIndex ? "bold" : "normal",
          }}>{number}</Text>
          {trainingExists && (
            <View style={{
              width: 6,
              height: 6,
              backgroundColor: "white",
              borderRadius: 3,
              marginTop: 4,
            }} />
          )}
        </TouchableOpacity>
      );
    }

    return (
      <View style={{ flexDirection: "column", marginBottom: 24 }}>
        <View className="flex-row items-center justify-between relative" style={{ flexDirection: "row", marginBottom: 10 }}>
          <Text style={{ color: "white", fontFamily: "InterBold", fontSize: 16, textAlign: "center", flex: 1 }}>
            Week {currentWeek + 1}
          </Text>
          <Text style={{ color: "#B4B4B4", fontFamily: "InterRegular", fontSize: 14, position: "absolute", right: 0 }}>
            {monthName}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <TouchableOpacity
            onPress={() => currentWeek > 0 && setCurrentWeek((w) => Math.max(w - 1, 0))}
            style={{ opacity: currentWeek > 0 ? 1 : 0.3 }}
          >
            <Text style={{ padding: 5, backgroundColor: "#FACC15", borderRadius: 10, color: "#1e1e1e", fontSize: 18, fontFamily: "Bison" }}>{"<"}</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: "row", flex: 1, justifyContent: "space-around" }}>
            {days}
          </View>

          <TouchableOpacity
            onPress={() => currentWeek < 11 && setCurrentWeek((w) => Math.min(w + 1, 11))}
            style={{ opacity: currentWeek < 11 ? 1 : 0.3 }}
          >
            <Text style={{ padding: 5, backgroundColor: "#FACC15", borderRadius: 10, color: "#1e1e1e", fontSize: 18, fontFamily: "Bison" }}>{">"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  /**
   * Renders a congratulatory message and post-program tips after completing the 84-day training cycle.
   *
   * @returns {React.JSX.Element}
   */
  const renderCompletedTraining = (): React.JSX.Element => {
    return (
      <View>
        <View style={styles.congratsContainer}>
          <Trophy color="#FACC15" size={60} />
          <Text className="text-2xl font-[InterBold] text-center text-white mb-2 mt-4">
            Training Completed!
          </Text>
          <Text className="text-[#B4B4B4] text-base text-center mb-4 font-[InterRegular]">
            Congratulations on completing your 84-day triathlon training program!
          </Text>
        </View>
        {renderVideo()}
        <TouchableOpacity 
          style={[styles.saveButton]} 
          onPress={() => setAlertVisible(true)}
        >
          <Text style={styles.saveButtonText}>
            Maintenance Tip
          </Text>
        </TouchableOpacity>
        <CustomAlert
          visible={alertVisible}
          title={"Maintenance Training"}
          message={"Continue with regular exercise to maintain your fitness level. Mix up your training with swimming, biking, and running sessions throughout the week to keep your triathlon skills sharp. Remember to include both endurance and intensity workouts."}
          onClose={() => setAlertVisible(false)}
        />
      </View>
    );
  };

  return (
    <>
      <ImageBackground
        source={require("@/assets/images/background.png")}
        style={[
          styles.backgroundImage,
          {
            width: screenWidth,
            height: screenHeight,
          },
        ]}
        resizeMode="cover"
      />
      <ScrollView contentContainerStyle={{ padding: 25, paddingTop: 122, paddingBottom: 82 }}>
        <View className="flex-row items-center justify-between mb-2 relative">
          <View className="flex-1 left-0">
            {isTrainingCompleted ? (
              <Text className="text-lg text-center text-white font-[InterBold]">Good luck with your triathlon journey!</Text>
            ) : appDay >= trainingEndDay ? (
              <Text className="text-base text-center text-white font-[InterRegular]">Triathlon Day</Text>
            ) : (
              <Text className="text-base text-white font-[InterRegular]">Day {appDay}</Text>
            )}
          </View>
          {trainingEndDay && appDay < trainingEndDay && (
            <Text className="text-base text-[#B4B4B4] font-[InterRegular] absolute right-0">
              /{trainingEndDay}
            </Text>
          )}
        </View>
        {!isTrainingCompleted && (
          <View style={styles.dayBarContainer}>
            <Animated.View style={[styles.dayBarFill, animatedBarStyle]} />
          </View>
        )}

        {trainingDay !== null && renderWeekDays()}

        {trainingDay === null ? (
          <View>
            <Text className="text-2xl font-[InterBold] text-center text-white mb-2">Training Coming Soon</Text>
            <Text className="text-[#B4B4B4] text-sm text-center mb-2 font-[InterRegular]">
              Training program starts on {startDate ? startDate.toDateString() : "loading..."}
            </Text>
            {renderVideo()}
          </View>
        ) : isTrainingCompleted ? (
          renderCompletedTraining()
        ) : trainingData ? (
          <View>
            <Text className="text-2xl font-[InterBold] text-center text-white mb-2">
              {trainingData.title}
            </Text>
            {renderVideo()}
            <View className="flex-row items-center justify-between gap-5 mt-5 mb-2 relative">
              <View className="w-[35%] bg-white/30 rounded-[10px] p-5 flex items-center justify-center">
                <View className="flex-row items-center justify-center gap-5">
                  <Timer color="#FACC15" size={45} />
                  <Text className="text-[50px] text-white font-[Bison]">{trainingData.duration}</Text> 
                </View>   
                <Text className="text-base text-[#b4b4b4] font-[InterRegular]">Minutes</Text>
              </View>
              
              <View className="w-[20%] bg-white/30 rounded-[10px] p-5 flex items-center justify-center">
                <View className="flex-row items-center justify-center">
                  <Text className="text-[50px] text-white font-[Bison]">{trainingData.zone}</Text>
                </View>  
                <Text className="text-base text-[#b4b4b4] text-center font-[InterRegular]">Zone</Text>
              </View>
              
              <View className="w-[35%] bg-white/30 rounded-[10px] p-5 flex items-center justify-center">
                <View className="flex-row items-center justify-center gap-5">
                  <LandPlot color="#FACC15" size={45} />
                  <Text className="text-[50px] text-white font-[Bison]">{trainingData.distance}</Text>  
                </View>
                <Text className="text-base text-[#b4b4b4] font-[InterRegular]">Kilometer</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[
                styles.saveButton,
              ]} 
              onPress={() => setAlertVisible(true)}
            >
              <Text style={styles.saveButtonText}>
                See Details
              </Text>
            </TouchableOpacity>
            <CustomTrainAlert
              visible={alertVisible}
              title={"Training Details"}
              message={trainingData.description}
              onClose={() => setAlertVisible(false)}
            />
          </View>
        ) : (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1E1E1E" }}>
            <ActivityIndicator size="large" color="white" />
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
    zIndex: -1,
    backgroundColor: "#1E1E1E",
  },
  saveButtonText: {
    color: "#1E1E1E",
    fontSize: 20,
    letterSpacing: 1.5,
    fontFamily: "Bison",
  },
  dayBarContainer: {
    height: 10,
    width: "100%",
    backgroundColor: "#ccc",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 25,
  },
  dayBarFill: {
    height: "100%",
    backgroundColor: "#FACC15",
    borderRadius: 10,
  },
  saveButton: {
    backgroundColor: "#FACC15",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    color: "white",
    fontFamily: "InterBold",
    textAlign: "center",
    marginBottom: 12,
  },
  loadingText: {
    color: "#B4B4B4",
    fontSize: 14,
  },
  congratsContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 15,
  },
});

export default Train;