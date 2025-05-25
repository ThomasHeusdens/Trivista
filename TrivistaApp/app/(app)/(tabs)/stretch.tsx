import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  ImageBackground,
  StyleSheet,
  Dimensions,
  ScrollView,
  Vibration,
} from "react-native";
import { useSession } from "@/context";
import { db } from "@/lib/firebase-db";
import { Timer, ChevronDown, ChevronUp } from "lucide-react-native";
import { Audio } from "expo-av";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  cancelAnimation,
  withSequence,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator } from "react-native";
import {
  collection,
  orderBy, 
  query,
  getDocs,
  getDoc,
  doc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { WebView } from "react-native-webview";

const Stretch = () => {
  const { user } = useSession();
  const screenHeight = Dimensions.get("window").height;
  const screenWidth = Dimensions.get("window").width;

  const [stretchings, setStretchings] = useState([]);
  const [trainingType, setTrainingType] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [selectedType, setSelectedType] = useState("pre");
  const [timerActive, setTimerActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTimeLeft, setTotalTimeLeft] = useState(0);

  const [randomVideos, setRandomVideos] = useState([]);
  const [trainingVideos, setTrainingVideos] = useState([]);
  const [showVideo, setShowVideo] = useState(false);
  const [selectedRandomVideo, setSelectedRandomVideo] = useState(null);
  
  const [pausedTimeLeft, setPausedTimeLeft] = useState(0);
  const [pausedTotalTimeLeft, setPausedTotalTimeLeft] = useState(0);
  const [pausedProgress, setPausedProgress] = useState(0);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [stretchingCompleted, setStretchingCompleted] = useState(false);

  const [loading, setLoading] = useState(true);
  const [stretchingsLoaded, setStretchingsLoaded] = useState(false);
  const [videosLoaded, setVideosLoaded] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);


  const progress = useSharedValue(0);
  const intervalRef = useRef(null);
  const globalTimerRef = useRef(null);
  const scrollViewRef = useRef(null);

  const loadBeep = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require("@/assets/sound/beep.mp3")
    );
    await sound.playAsync();
  };

  const isToday = (timestamp) => {
    if (!timestamp) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const date = timestamp.toDate();
    date.setHours(0, 0, 0, 0);
    
    return today.getTime() === date.getTime();
  };

  const checkStretchingCompletion = async () => {
    if (!user) return;
    
    try {
      const stretchingDocId = `${user.uid}_${selectedType}`;
      const stretchingDoc = await getDoc(doc(db, "UserFinishedStretching", stretchingDocId));
      
      if (stretchingDoc.exists()) {
        const data = stretchingDoc.data();
        if (data.done && isToday(data.timestamp)) {
          setStretchingCompleted(true);
          return;
        }
      }
      
      setStretchingCompleted(false);
    } catch (error) {
      console.error("Error checking stretching completion:", error);
      setStretchingCompleted(false);
    }
  };

  const saveStretchingCompletion = async () => {
    if (!user) return;
    
    try {
      const stretchingDocId = `${user.uid}_${selectedType}`;
      await setDoc(doc(db, "UserFinishedStretching", stretchingDocId), {
        done: true,
        timestamp: Timestamp.now()
      });
      
      setStretchingCompleted(true);
    } catch (error) {
      console.error("Error saving stretching completion:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const snap = await getDoc(doc(db, "UserStartDate", user.uid));
      if (!snap.exists()) return;

      const { startDate: startStr } = snap.data();
      const [day, month, year] = startStr.split("-").map(Number);
      const start = new Date(Date.UTC(year, month - 1, day));
      setStartDate(start);

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));

      if (diff < 0) setTrainingType("off");
      else {
        const trainingSnap = await getDocs(collection(db, "Training"));
        const trainings = trainingSnap.docs.map((doc) => doc.data());
        const todayTraining = trainings.find((t) => t.day === diff + 1);
        setTrainingType(todayTraining?.type || "off");
      }
      setDataLoaded(true);
    };

    const fetchStretchings = async () => {
      try {
        const snap = await getDocs(collection(db, "Stretching"));
        const all = snap.docs.map((doc) => doc.data());
        setStretchings(all);
      } catch (err) {
        console.error("Error fetching stretchings:", err);
      } finally {
        setStretchingsLoaded(true);
      }
    };


    const fetchVideos = async () => {
      try {
        const trainingSnap = await getDocs(collection(db, "TrainingVideos"));
        const randomSnap = await getDocs(query(collection(db, "RandomVideos"), orderBy("iframe")));
        
        setTrainingVideos(trainingSnap.docs.map((doc) => doc.data()));
        const randomVideosData = randomSnap.docs.map((doc) => doc.data());
        setRandomVideos(randomVideosData);
        
        if (randomVideosData.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (user) {
            const createdAt = new Date(user.metadata.creationTime);
            createdAt.setHours(0, 0, 0, 0);
            const daysWaiting = Math.floor((today - createdAt) / (1000 * 60 * 60 * 24));
            const index = daysWaiting % randomVideosData.length;
            setSelectedRandomVideo(randomVideosData[index]);
          } else {
            const randomIndex = Math.floor(Math.random() * randomVideosData.length);
            setSelectedRandomVideo(randomVideosData[randomIndex]);
          }
        }
        setVideosLoaded(true);
      } catch (err) {
        console.error("Failed to fetch videos", err);
      }
    };

    fetchVideos();
    fetchData();
    fetchStretchings();
  }, [user]);

  useEffect(() => {
    if (stretchingsLoaded && videosLoaded && dataLoaded) {
      setLoading(false);
    }
  }, [stretchingsLoaded, videosLoaded, dataLoaded]);

  useEffect(() => {
    checkStretchingCompletion();
  }, [user, selectedType]);

  useEffect(() => {
    setCompletedExercises([]);
  }, [selectedType, timerActive]);

  const filtered = stretchings.filter(
    (s) => s.training === trainingType && s.type === selectedType
  );

  const displayedExercises = filtered.filter((_, index) => 
    !completedExercises.includes(index) || index === currentExerciseIndex
  );

  const totalSessionDuration = filtered.reduce((sum, s) => sum + s.duration, 0);
  const currentExercise = filtered[currentExerciseIndex];

  useEffect(() => {
    if (scrollViewRef.current && timerActive) {
      scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
    }
  }, [currentExerciseIndex, timerActive]);

  useEffect(() => {
    if (timerActive && !paused) {
      if (pausedTotalTimeLeft === 0) {
        setTotalTimeLeft(totalSessionDuration);
      } else {
        setTotalTimeLeft(pausedTotalTimeLeft);
      }

      globalTimerRef.current = setInterval(() => {
        setTotalTimeLeft((prev) => Math.max(prev - 1, 0));
      }, 1000);
    }
    return () => clearInterval(globalTimerRef.current);
  }, [timerActive, paused]);

  useEffect(() => {
    if (!timerActive || paused || !currentExercise) return;

    if (pausedTimeLeft === 0) {
      setTimeLeft(currentExercise.duration);
      progress.value = 0;
    } else {
      setTimeLeft(pausedTimeLeft);
      progress.value = pausedProgress;
    }

    const remainingDuration = pausedTimeLeft > 0 
      ? pausedTimeLeft * 1000 
      : currentExercise.duration * 1000;
    
    const targetProgress = 1;
    
    if (pausedTimeLeft > 0) {
      progress.value = withTiming(targetProgress, {
        duration: remainingDuration,
      });
    } else {
      progress.value = withTiming(targetProgress, {
        duration: remainingDuration,
      });
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          loadBeep();
          Vibration.vibrate(500);

          setCompletedExercises(prev => [...prev, currentExerciseIndex]);

          setPausedTimeLeft(0);
          setPausedProgress(0);

          if (currentExerciseIndex + 1 < filtered.length) {
            setCurrentExerciseIndex((i) => i + 1);
            setTimerActive(true);
          } else {
            setTimerActive(false);
            setCurrentExerciseIndex(0);
            setCompletedExercises([]);
            saveStretchingCompletion();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [timerActive, paused, currentExerciseIndex]);

  useEffect(() => {
    if (paused) {
      setPausedTimeLeft(timeLeft);
      setPausedTotalTimeLeft(totalTimeLeft);
      setPausedProgress(progress.value);
      
      cancelAnimation(progress);
      clearInterval(intervalRef.current);
      clearInterval(globalTimerRef.current);
    } 
  }, [paused]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
    height: 5,
    backgroundColor: "#FACC15",
  }));

  const handlePauseResume = () => {
    setPaused(!paused);
  };

  const handleStop = () => {
    setPaused(false);
    setTimerActive(false);
    setCurrentExerciseIndex(0);
    setTimeLeft(0);
    setTotalTimeLeft(0);
    setPausedTimeLeft(0);
    setPausedTotalTimeLeft(0);
    setPausedProgress(0);
    progress.value = 0;
    setCompletedExercises([]);
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
        style={[styles.backgroundImage, { width: screenWidth, height: screenHeight }]}
        resizeMode="cover"
      />
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={{ padding: 25, paddingTop: 122, paddingBottom: 230 }}
      >
        <Text className="text-white text-2xl font-[InterBold] text-center mb-5">Today's training sessions</Text>

        {!showVideo && !timerActive && !stretchingCompleted && (
          <View className="flex-1 items-center mb-5">        
            <View className="flex-row justify-between mb-5 w-[100%] self-center">
              <Pressable
                onPress={() => setSelectedType("pre")}
                className={`rounded-[10px] px-6 py-5 w-[48%] items-center ${selectedType === "pre" ? "bg-white/30" : "bg-[#FACC15]"}`}
              >
                <Text className={`font-[Bison] ${selectedType === "pre" ? "text-white" : "text-[#1E1E1E]"}`} style={{ letterSpacing: 1.5, fontSize: 20 }}>
                  PRE
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedType("post")}
                className={`rounded-[10px] px-6 py-5 w-[48%] items-center ${selectedType === "post" ? "bg-white/30" : "bg-[#FACC15]"}`}
              >
                <Text className={`font-[Bison] ${selectedType === "post" ? "text-white" : "text-[#1E1E1E]"}`} style={{ letterSpacing: 1.5, fontSize: 20 }}>
                  POST
                </Text>
              </Pressable>
            </View>
            <View className="flex-1 w-[100%] items-center">
              <Pressable className="bg-white/30 rounded-[10px] px-2 py-2 w-[100%] items-center border border-[#FACC15] flex-row justify-between" onPress={() => setShowVideo((prev) => !prev)}>
                <ChevronDown color="white" size={20} />
                <Text className="text-white font-[Bison]" style={{ letterSpacing: 1.5, fontSize: 15 }}>Today's YouTube video</Text>
                <ChevronDown color="white" size={20} />
              </Pressable>
            </View>
          </View>
        )}

        {showVideo && !timerActive && !stretchingCompleted && (
          <View>        
            <View className="flex-row justify-between mb-5 w-[100%] self-center">
              <Pressable
                onPress={() => setSelectedType("pre")}
                className={`rounded-[10px] px-6 py-5 w-[48%] items-center ${selectedType === "pre" ? "bg-white/30" : "bg-[#FACC15]"}`}
              >
                <Text className={`font-[Bison] ${selectedType === "pre" ? "text-white" : "text-[#1E1E1E]"}`} style={{ letterSpacing: 1.5, fontSize: 20 }}>
                  PRE
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedType("post")}
                className={`rounded-[10px] px-6 py-5 w-[48%] items-center ${selectedType === "post" ? "bg-white/30" : "bg-[#FACC15]"}`}
              >
                <Text className={`font-[Bison] ${selectedType === "post" ? "text-white" : "text-[#1E1E1E]"}`} style={{ letterSpacing: 1.5, fontSize: 20 }}>
                  POST
                </Text>
              </Pressable>
            </View>
            <View className="flex-1 w-[100%] items-center mb-4">
              <Pressable className="bg-white/30 rounded-[10px] px-2 py-2 w-[100%] items-center border border-[#FACC15] flex-row justify-between" onPress={() => setShowVideo((prev) => !prev)}>
                <ChevronUp color="white" size={20} />
                <Text className="text-white font-[Bison]" style={{ letterSpacing: 1.5, fontSize: 15 }}>Today's YouTube video</Text>
                <ChevronUp color="white" size={20} />
              </Pressable>
            </View>
            <View style={{ height: 200, marginBottom: 15, borderRadius: 10, overflow: "hidden" }}>
              <WebView
                source={{
                  uri: (() => {
                    const videoUrl = !startDate
                      ? selectedRandomVideo?.iframe || ""
                      : (() => {
                          const today = new Date();
                          today.setUTCHours(0, 0, 0, 0);
                          const diff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
                          if (diff < 0 || !trainingVideos.length) {
                            return selectedRandomVideo?.iframe || "";
                          } else {
                            return trainingVideos.find((v) => v.day === diff + 1)?.iframe || "";
                          }
                        })();
                    return videoUrl;
                  })()
                }}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        )}

        {showVideo && timerActive && (
          <View>
            <Pressable className="bg-white/30 rounded-[10px] px-2 py-2 mb-4 w-[100%] items-center border border-[#FACC15] flex-row justify-between" onPress={() => setShowVideo((prev) => !prev)}>
              <ChevronUp color="white" size={20} />
              <Text className="text-white font-[Bison]" style={{ letterSpacing: 1.5, fontSize: 15 }}>Today's YouTube video</Text>
              <ChevronUp color="white" size={20} />
            </Pressable>
            <View style={{ height: 200, marginBottom: 15, borderRadius: 10, overflow: "hidden" }}>
              <WebView
                source={{
                  uri: (() => {
                    if (!startDate) {
                      return selectedRandomVideo?.iframe || "";
                    } else {
                      const today = new Date();
                      today.setUTCHours(0, 0, 0, 0);
                      const diff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
                      if (diff < 0 || !trainingVideos.length) {
                        return selectedRandomVideo?.iframe || "";
                      } else {
                        return trainingVideos.find((v) => v.day === diff + 1)?.iframe || "";
                      }
                    }
                  })()
                }}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        )}

        {!showVideo && timerActive && (
          <View className="flex-1 w-[100%] items-center mb-5">
            <Pressable className="bg-white/30 rounded-[10px] px-2 py-2 w-[100%] items-center border border-[#FACC15] flex-row justify-between" onPress={() => setShowVideo((prev) => !prev)}>
              <ChevronDown color="white" size={20} />
              <Text className="text-white font-[Bison]" style={{ letterSpacing: 1.5, fontSize: 15 }}>Today's YouTube video</Text>
              <ChevronDown color="white" size={20} />
            </Pressable>
          </View>
        )}

        {/* Show completion message when stretching is done */}
        {showVideo && stretchingCompleted && !timerActive && (
          <View className="items-center">
            <View className="flex-row justify-between mb-6 w-[100%]">
              <Pressable
                onPress={() => setSelectedType("pre")}
                className={`rounded-[10px] px-6 py-5 w-[48%] items-center ${selectedType === "pre" ? "bg-white/30" : "bg-[#FACC15]"}`}
              >
                <Text className={`font-[Bison] ${selectedType === "pre" ? "text-white" : "text-[#1E1E1E]"}`} style={{ letterSpacing: 1.5, fontSize: 20 }}>
                  PRE
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedType("post")}
                className={`rounded-[10px] px-6 py-5 w-[48%] items-center ${selectedType === "post" ? "bg-white/30" : "bg-[#FACC15]"}`}
              >
                <Text className={`font-[Bison] ${selectedType === "post" ? "text-white" : "text-[#1E1E1E]"}`} style={{ letterSpacing: 1.5, fontSize: 20 }}>
                  POST
                </Text>
              </Pressable>
            </View>
            <View>
              <Pressable className="bg-white/30 rounded-[10px] px-2 py-2 mb-4 w-[100%] items-center border border-[#FACC15] flex-row justify-between" onPress={() => setShowVideo((prev) => !prev)}>
                <ChevronUp color="white" size={20} />
                <Text className="text-white font-[Bison]" style={{ letterSpacing: 1.5, fontSize: 15 }}>Today's YouTube video</Text>
                <ChevronUp color="white" size={20} />
              </Pressable>
              <View style={{ height: 200, marginBottom: 15, borderRadius: 10, overflow: "hidden" }}>
                <WebView
                  source={{
                    uri: (() => {
                      if (!startDate) {
                        return selectedRandomVideo?.iframe || "";
                      } else {
                        const today = new Date();
                        today.setUTCHours(0, 0, 0, 0);
                        const diff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
                        if (diff < 0 || !trainingVideos.length) {
                          return selectedRandomVideo?.iframe || "";
                        } else {
                          return trainingVideos.find((v) => v.day === diff + 1)?.iframe || "";
                        }
                      }
                    })()
                  }}
                  allowsInlineMediaPlayback={true}
                  mediaPlaybackRequiresUserAction={false}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
            <Text className="text-white font-[InterBold] text-xl text-center mb-2">
              Today's {selectedType === "pre" ? "Pre" : "Post"}-Stretching Completed!
            </Text>
            <Text className="text-[#B4B4B4] font-[InterRegular] text-base text-center">
              Great job! You've already completed your {selectedType === "pre" ? "pre" : "post"}-stretching for today.
            </Text>
          </View>
        )}

        {!showVideo && stretchingCompleted && !timerActive && (
          <View className="items-center">
            <View className="flex-row justify-between mb-6 w-[100%]">
              <Pressable
                onPress={() => setSelectedType("pre")}
                className={`rounded-[10px] px-6 py-5 w-[48%] items-center ${selectedType === "pre" ? "bg-white/30" : "bg-[#FACC15]"}`}
              >
                <Text className={`font-[Bison] ${selectedType === "pre" ? "text-white" : "text-[#1E1E1E]"}`} style={{ letterSpacing: 1.5, fontSize: 20 }}>
                  PRE
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedType("post")}
                className={`rounded-[10px] px-6 py-5 w-[48%] items-center ${selectedType === "post" ? "bg-white/30" : "bg-[#FACC15]"}`}
              >
                <Text className={`font-[Bison] ${selectedType === "post" ? "text-white" : "text-[#1E1E1E]"}`} style={{ letterSpacing: 1.5, fontSize: 20 }}>
                  POST
                </Text>
              </Pressable>
            </View>
            <View>
              <Pressable className="bg-white/30 rounded-[10px] px-2 py-2 mb-4 w-[100%] items-center border border-[#FACC15] flex-row justify-between" onPress={() => setShowVideo((prev) => !prev)}>
                <ChevronDown color="white" size={20} />
                <Text className="text-white font-[Bison]" style={{ letterSpacing: 1.5, fontSize: 15 }}>Today's YouTube video</Text>
                <ChevronDown color="white" size={20} />
              </Pressable>
            </View>
            <Text className="text-white font-[InterBold] text-xl text-center mb-2">
              Today's {selectedType === "pre" ? "Pre" : "Post"}-Stretching Completed!
            </Text>
            <Text className="text-[#B4B4B4] font-[InterRegular] text-base text-center">
              Great job! You've already completed your {selectedType === "pre" ? "pre" : "post"}-stretching for today.
            </Text>
          </View>
        )}

        {timerActive && currentExercise && (
          <View className="rounded-[10px] overflow-hidden mb-5">
            <Image source={require("@/assets/images/bicycle.jpg")} style={{ width: "100%", height: 220 }} resizeMode="cover" />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.8)"]}
              style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, padding: 12 }}
            >
              <Text numberOfLines={1} className="text-white font-[InterBold] text-xl">{currentExercise.name}</Text>
            </LinearGradient>
            <View style={{ backgroundColor: "#b4b4b4" }}>
              <Animated.View style={barStyle} />
            </View>
          </View>
        )}

        {/* Only show exercises when not completed */}
        {!timerActive && !stretchingCompleted && filtered.map((s, i) => (
          <View key={i} className="flex-row bg-white/20 rounded-[10px] mb-5 overflow-hidden">
            <Image
              source={require("@/assets/images/bicycle.jpg")}
              style={{ width: 100, minHeight: 100, height: "100%", alignSelf: "stretch", borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }}
              resizeMode="cover"
            />
            <View className="flex-1 p-4">
              <Text className="text-white font-[InterBold] text-base mb-1">{s.name}</Text>
              <Text className="text-[#B4B4B4] font-[InterRegular] text-sm">{s.description}</Text>
            </View>
          </View>
        ))}
        
        {/* When training is active, show only upcoming exercises */}
        {timerActive && displayedExercises
          .filter((_, idx) => idx !== 0) 
          .map((s, i) => (
            <View key={i} className="flex-row bg-white/20 rounded-[10px] mb-5 overflow-hidden">
              <Image
                source={require("@/assets/images/bicycle.jpg")}
                style={{ width: 100, minHeight: 100, height: "100%", alignSelf: "stretch", borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }}
                resizeMode="cover"
              />
              <View className="flex-1 p-4">
                <Text className="text-white font-[InterBold] text-base mb-1">{s.name}</Text>
                <Text className="text-[#B4B4B4] font-[InterRegular] text-sm">{s.description}</Text>
              </View>
            </View>
          ))
        }
      </ScrollView>

      {timerActive && (
        <>
          <View className="absolute bottom-[165px] left-[25px] bg-[#1e1e1e] rounded-xl px-6 py-5 right-[25px] items-center">
            <View className="flex-row items-center gap-4">
              <Timer color="#FACC15" size={28} />
              <Text className="text-white text-[20px] font-[Bison]">
                {Math.floor(totalTimeLeft / 60)}:{(totalTimeLeft % 60).toString().padStart(2, "0")}
              </Text>
            </View>
          </View>

          <View className="absolute bottom-[90px] left-[25px] right-[25px] flex-row justify-between">
            <Pressable
              onPress={handleStop}
              className="bg-[#FACC15] rounded-[10px] w-[48%] items-center py-5 px-6"
            >
              <Text className="text-[#1E1E1E] font-[Bison] text-[20px] mt-1">Stop</Text>
            </Pressable>
            <Pressable
              onPress={handlePauseResume}
              className="bg-[#FACC15] rounded-[10px] w-[48%] items-center py-5 px-6"
            >
              <Text className="text-[#1E1E1E] font-[Bison] text-[20px] mt-1">{paused ? "Resume" : "Pause"}</Text>
            </Pressable>
          </View>
        </>
      )}

      {!timerActive && !stretchingCompleted && (
        <Pressable
          onPress={() => {
            setTimerActive(true);
            setPausedTimeLeft(0);
            setPausedTotalTimeLeft(0);
            setPausedProgress(0);
            setCompletedExercises([]);
          }}
          className="absolute bottom-[90px] left-[25px] right-[25px] bg-[#FACC15] py-5 px-6 rounded-[10px] items-center"
        >
          <Text className="text-[#1E1E1E] text-[20px] font-[Bison]" style={{ letterSpacing: 1.5 }}>
            Start
          </Text>
        </Pressable>
      )}
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
});

export default Stretch;