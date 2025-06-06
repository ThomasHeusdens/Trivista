/**
 * Displays daily recovery tips based on the number of days since user registration.
 * Fetches tips from Firestore for the first 91 days, and randomly selects cached tips beyond that.
 * Tips are categorized (hydration, sleep, stretching, general) and include external resource links.
 * @module
 */
import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Pressable,
  Text,
  ImageBackground,
  StyleSheet,
  Dimensions,
  Linking,
} from "react-native";
import StretchingIcon from "@/components/StretchingIcon";
import { useSession } from "@/context";
import { db } from "@/lib/firebase-db";
import { collection, query, where, getDocs } from "firebase/firestore";
import { ActivityIndicator } from "react-native";
import {
  GlassWater,
  BedDouble,
  StretchHorizontal,
  Brain,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Calculates the current day since account creation and displays daily tips
 * pulled from Firestore. Tips are rendered by category and link to external resources.
 *
 * @returns {React.JSX.Element} React Native screen with recovery tips UI.
 */
const Recover = (): React.JSX.Element => {
  const { user } = useSession();
  const router = useRouter();
  const screenHeight = Dimensions.get("window").height;
  const screenWidth = Dimensions.get("window").width;

  const [loading, setLoading] = useState(true);
  const [tipsLoaded, setTipsLoaded] = useState(false);

  const [tips, setTips] = useState([]);

  const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

  /**
   * Calculates the number of days since the user created their account.
   * Resets both timestamps to midnight to ensure day-difference consistency.
   *
   * @returns {number|null} Current day number since registration or null if user is not defined.
   */
  const currentDay = user?.metadata?.creationTime
    ? (() => {
        const createdAt = new Date(user.metadata.creationTime);
        const now = new Date();
        createdAt.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        const diffInDays = Math.floor(
          (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        return diffInDays + 1;
      })()
    : null;

  /**
   * Fetches recovery tips from Firestore based on the current day.
   * Updates the local state with matching tips.
   *
   * @async
   * @returns {Promise<void>}
   */
  useEffect(() => {
    const fetchTips = async () => {
      if (!currentDay) return;

      const todayKey = `dailyTips_${currentDay}`;

      if (currentDay <= 91) {
        try {
          const q = query(collection(db, "Recovery"), where("day", "==", currentDay));
          const snapshot = await getDocs(q);
          const fetched = snapshot.docs.map((doc) => doc.data());
          setTips(fetched);
        } catch (err) {
          console.error("Error fetching tips for today:", err);
        } finally {
          setTipsLoaded(true);
        }
        return;
      }

      try {
        const cached = await AsyncStorage.getItem(todayKey);
        if (cached) {
          setTips(JSON.parse(cached));
          setTipsLoaded(true);
          return;
        }

        const snapshot = await getDocs(collection(db, "Recovery"));
        const allTips = snapshot.docs.map((doc) => doc.data());

        const categories = ["hydration", "sleep", "stretching", "general"];
        const randomTips = categories
          .map((type) => {
            const matching = allTips.filter((tip) => tip.type.toLowerCase() === type);
            return getRandomElement(matching);
          })
          .filter(Boolean);

        setTips(randomTips);
        await AsyncStorage.setItem(todayKey, JSON.stringify(randomTips));
      } catch (err) {
        console.error("Fallback error fetching tips:", err);
      } finally {
        setTipsLoaded(true);
      }
    };

    fetchTips();
  }, [currentDay]);


  useEffect(() => {
    if (tipsLoaded) {
      setLoading(false);
    }
  }, [tipsLoaded]);


  /**
   * Returns a recovery tip object by its type.
   *
   * @param {string} type - The type of tip (e.g., "hydration", "sleep").
   * @returns {object|undefined} Tip object matching the type or undefined if not found.
   */
  const getTipByType = (type: string): object | undefined =>
    tips.find((tip) => tip.type.toLowerCase() === type.toLowerCase());

  const hydration = getTipByType("hydration");
  const sleep = getTipByType("sleep");
  const stretching = getTipByType("stretching");
  const general = getTipByType("general");

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
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 25, paddingTop: 122, paddingBottom: 82 }}
      >
        <Text className="text-2xl font-[InterBold] text-center text-white mb-2">
          Daily recharge routine
        </Text>
        <Text className="text-base font-[InterRegular] text-center text-[#B4B4B4] mb-9">
          Each day, you’ll discover a new tip or fact about sleep, hydration, and stretching — starting with the basics and gradually building toward deeper, more advanced insights as you progress.
        </Text>

        <View className="bg-white/30 p-4 rounded-[10px] flex-row justify-between mb-9 items-center">
          <View className="flex-column items-left w-[75%]">
            <Text className="text-white text-base font-[InterBold] ml-2 mb-2">Don't forget your post-stretching!</Text>
            <Text className="text-[#B4B4B4] text-sm font-[InterRegular] ml-2">Post-training stretching helps your muscles recover faster, reduces soreness, and improves flexibility over time.</Text>
          </View>
          <Pressable onPress={() => router.push("stretch")} className="w-[20%] aspect-square items-center justify-center bg-[#FACC15] rounded-[10px]">
            <StretchingIcon size={50} color={"#1e1e1e"} />
          </Pressable>
        </View>

        <Text className="text-xl font-[InterBold] text-center text-white mb-4">
          Important tips
        </Text>

        <View className="flex-column justify-between mb-4">
          <View className="flex-row justify-between mb-4 gap-4">
            {hydration && (
              <Pressable
                className="bg-white/30 rounded-[10px] p-4 flex-1"
                onPress={() => hydration.source && Linking.openURL(hydration.source)}
              >
                <View className="flex-1 justify-between">
                  <View>
                    <View className="flex-row mb-2">
                      <GlassWater size={18} color="#FACC15" />
                      <Text className="text-yellow-400 font-[InterBold] text-base ml-2">Hydration</Text>
                    </View>
                    <Text className="text-white text-sm font-[InterRegular] mb-4">
                      {hydration.tip}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-[#B4B4B4] text-sm font-[InterRegular] mr-1">Read more</Text>
                    <Text className="text-[#B4B4B4] text-base font-bold">›</Text>
                  </View>
                </View>
              </Pressable>
            )}
            {sleep && (
              <Pressable
                className="bg-white/30 rounded-[10px] p-4 flex-1"
                onPress={() => sleep.source && Linking.openURL(sleep.source)}
              >
                <View className="flex-1 justify-between">
                  <View>
                    <View className="flex-row mb-2">
                      <BedDouble size={18} color="#FACC15" />
                      <Text className="text-yellow-400 font-[InterBold] text-base ml-2">Sleep</Text>
                    </View>
                    <Text className="text-white text-sm font-[InterRegular] mb-4">
                      {sleep.tip}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-[#B4B4B4] text-sm font-[InterRegular] mr-1">Read more</Text>
                    <Text className="text-[#B4B4B4] text-base font-bold">›</Text>
                  </View>
                </View>
              </Pressable>
            )}
          </View>

          <View className="flex-row justify-between mb-4 gap-4">
            {stretching && (
              <Pressable
                className="bg-white/30 rounded-[10px] p-4 flex-1"
                onPress={() => stretching.source && Linking.openURL(stretching.source)}
              >
                <View className="flex-1 justify-between">
                  <View>
                    <View className="flex-row mb-2">
                      <StretchingIcon size={18} color="#FACC15" />
                      <Text className="text-yellow-400 font-[InterBold] text-base ml-2">Stretching</Text>
                    </View>
                    <Text className="text-white text-sm font-[InterRegular] mb-4">
                      {stretching.tip}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-[#B4B4B4] text-sm font-[InterRegular] mr-1">Read more</Text>
                    <Text className="text-[#B4B4B4] text-base font-bold">›</Text>
                  </View>
                </View>
              </Pressable>
            )}
            {general && (
              <Pressable
                className="bg-white/30 rounded-[10px] p-4 flex-1"
                onPress={() => general.source && Linking.openURL(general.source)}
              >
                <View className="flex-1 justify-between">
                  <View>
                    <View className="flex-row mb-2">
                      <Brain size={18} color="#FACC15" />
                      <Text className="text-yellow-400 font-[InterBold] text-base ml-2">General</Text>
                    </View>
                    <Text className="text-white text-sm font-[InterRegular] mb-4">
                      {general.tip}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-[#B4B4B4] text-sm font-[InterRegular] mr-1">Read more</Text>
                    <Text className="text-[#B4B4B4] text-base font-bold">›</Text>
                  </View>
                </View>
              </Pressable>
            )}
          </View>
        </View>
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
});

export default Recover;
