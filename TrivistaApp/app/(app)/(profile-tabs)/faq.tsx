import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
  Animated,
} from "react-native";
import { ImageBackground } from "react-native";
import { BlurView } from "expo-blur";
import { ChevronDown } from "lucide-react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase-db";

const screenHeight = Dimensions.get("window").height;
const screenWidth = Dimensions.get("window").width;

const FAQ = () => {
  const [faqItems, setFaqItems] = useState<any[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const rotation = useState(new Animated.Value(0))[0];

  const fetchFAQs = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "FAQ"));
      const items = querySnapshot.docs.map((doc) => doc.data());
      setFaqItems(items);
    } catch (error) {
      console.error("Failed to fetch FAQ:", error);
    }
  };

  const toggleItem = (index: number) => {
    if (index === openIndex) {
      setOpenIndex(null);
      Animated.timing(rotation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      setOpenIndex(index);
      Animated.timing(rotation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const getRotation = (index: number) =>
    rotation.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", index === openIndex ? "180deg" : "0deg"],
    });

  useEffect(() => {
    fetchFAQs();
  }, []);

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

        <FlatList
        data={faqItems}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{
            paddingTop: 122,    // Space below top nav
            paddingBottom: 82, // Space above bottom nav
            paddingHorizontal: 15,
        }}
        renderItem={({ item, index }) => (
            <Pressable onPress={() => toggleItem(index)} style={{ marginBottom: 12 }}>
            <BlurView intensity={60} tint="light" style={styles.card}>
                <View style={styles.row}>
                <Text style={styles.question}>{item.question}</Text>
                <Animated.View style={{ transform: [{ rotate: getRotation(index) }] }}>
                    <ChevronDown color="white" size={24} />
                </Animated.View>
                </View>

                {openIndex === index && (
                <>
                    <View style={styles.separator} />
                    <Text style={styles.answer}>{item.answer}</Text>
                </>
                )}
            </BlurView>
            </Pressable>
        )}
        />

    </>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: -1,
  },
  card: {
    borderRadius: 10,
    padding: 16,
    overflow: "hidden",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  question: {
    color: "white",
    fontSize: 16,
    width: "85%",
    fontFamily: "InterBold",
  },
  answer: {
    color: "#fff",
    fontSize: 14,
    marginTop: 10,
    fontFamily: "InterRegular",
  },
  separator: {
    borderBottomColor: "#b4b4b4",
    borderBottomWidth: 1,
    marginTop: 10,
  },
});

export default FAQ;
