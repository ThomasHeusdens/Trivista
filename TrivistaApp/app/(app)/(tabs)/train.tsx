import { useSession } from "@/context";
import { db } from "@/lib/firebase-db";
import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";
import {
  LandPlot,
  Timer
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  ImageBackground,
  Pressable,
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
import { WebView } from "react-native-webview";

const Train = () => {
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
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;

  const progress = useSharedValue(0);

  useEffect(() => {
    const computeDays = async () => {
      if (!user) return;
      const createdAt = new Date(user.metadata.creationTime);
      const today = new Date();
      createdAt.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const daysSinceCreation = Math.floor(
        (today - createdAt) / (1000 * 60 * 60 * 24)
      ) + 1;
      setAppDay(daysSinceCreation);
      progress.value = withTiming(daysSinceCreation / 91, { duration: 800 });
    };
    computeDays();
  }, [user]);

  useEffect(() => {
    const fetchTrainingDay = async () => {
      if (!user) return;
      try {
        const createdAt = new Date(user.metadata.creationTime);
        createdAt.setUTCHours(0, 0, 0, 0);
        const docRef = doc(db, "UserStartDate", user.uid);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return;
        const { startDate: startStr } = snap.data();
        const [day, month, year] = startStr.split("-").map(Number);
        const start = new Date(Date.UTC(year, month - 1, day));
        setStartDate(start);
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
        if (diff < 0) {
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
      } catch (err) {
        console.error("Error getting start date:", err);
      }
    };
    fetchTrainingDay();
  }, [user]);

  useEffect(() => {
    const fetchTraining = async () => {
      try {
        const colSnap = await getDocs(collection(db, "Training"));
        const all = colSnap.docs.map((doc) => doc.data());
        setAllTrainings(all);
        if (trainingDay) {
          const todayTraining = all.find((t) => t.day === trainingDay);
          setTrainingData(todayTraining);
        }
      } catch (err) {
        console.error("Failed to load training", err);
      }
    };
    fetchTraining();
  }, [trainingDay]);

  useEffect(() => {
    if (selectedDay && allTrainings.length > 0) {
      const selected = allTrainings.find((t) => t.day === selectedDay);
      setTrainingData(selected);
    }
  }, [selectedDay, allTrainings]);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const trainingSnap = await getDocs(collection(db, "TrainingVideos"));
        const randomSnap = await getDocs(query(collection(db, "RandomVideos"), orderBy("iframe")));
        setTrainingVideos(trainingSnap.docs.map((doc) => doc.data()));
        setRandomVideos(randomSnap.docs.map((doc) => doc.data()));
      } catch (err) {
        console.error("Failed to fetch videos", err);
      }
    };
    fetchVideos();
  }, []);

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: `${Math.min(progress.value * 100, 100)}%`,
  }));

  const renderVideo = () => {
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
          <WebView source={{ uri: video.iframe }} style={{ flex: 1 }} />
        </View>
      ) : null;
    } else {
      const video = trainingVideos.find((v) => v.day === selectedDay);
      return video ? (
        <View style={{ height: 200, marginTop: 12, borderRadius: 12, overflow: "hidden" }}>
          <WebView source={{ uri: video.iframe }} style={{ flex: 1 }} />
        </View>
      ) : null;
    }
  };

  const renderWeekDays = () => {
    if (!startDate || trainingDay === null) return null;
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
        <Pressable
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
        </Pressable>
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
          <Pressable
            onPress={() => currentWeek > 0 && setCurrentWeek((w) => Math.max(w - 1, 0))}
            style={{ opacity: currentWeek > 0 ? 1 : 0.3 }}
          >
            <Text style={{ padding: 5, backgroundColor: "#FACC15", borderRadius: 10, color: "#1e1e1e", fontSize: 18, fontFamily: "Bison" }}>{"<"}</Text>
          </Pressable>

          <View style={{ flexDirection: "row", flex: 1, justifyContent: "space-around" }}>
            {days}
          </View>

          <Pressable
            onPress={() => currentWeek < 11 && setCurrentWeek((w) => Math.min(w + 1, 11))}
            style={{ opacity: currentWeek < 11 ? 1 : 0.3 }}
          >
            <Text style={{ padding: 5, backgroundColor: "#FACC15", borderRadius: 10, color: "#1e1e1e", fontSize: 18, fontFamily: "Bison" }}>{">"}</Text>
          </Pressable>
        </View>
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
      <ScrollView contentContainerStyle={{ padding: 25, paddingTop: 122 }}>
        <View className="flex-row items-center justify-between mb-2 relative">
          <View className="flex-1 left-0">
            <Text className="text-base text-white font-[InterRegular]">Day {appDay}</Text>
          </View>
          {trainingEndDay && (
            <Text className="text-base text-[#B4B4B4] font-[InterRegular] absolute right-0">
              /{trainingEndDay}
            </Text>
          )}
        </View>
        <View style={styles.dayBarContainer}>
          <Animated.View style={[styles.dayBarFill, animatedBarStyle]} />
        </View>

        {trainingDay !== null && renderWeekDays()}

        {trainingDay === null ? (
          <View>
            <Text className="text-2xl font-[InterBold] text-center text-white mb-2">Training Coming Soon</Text>
            <Text className="text-[#B4B4B4] text-sm text-center mb-2 font-[InterRegular]">
              Training program starts on {startDate ? startDate.toDateString() : "loading..."}
            </Text>
            {renderVideo()}
          </View>
        ) : trainingData ? (
          <View>
            <Text className="text-2xl font-[InterBold] text-center text-white mb-2">
              Day {selectedDay}: {trainingData.title}
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
            <Pressable 
              style={[
                styles.saveButton,
              ]} 
              onPress={ () => Alert.alert("Training Details", trainingData.description) }
            >
              <Text style={styles.saveButtonText}>
                See Details
              </Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.loadingText}>Loading training...</Text>
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
});

export default Train;