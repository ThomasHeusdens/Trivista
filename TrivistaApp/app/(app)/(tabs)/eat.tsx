import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  FlatList,
  ScrollView,
  ImageBackground,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useSession } from "@/context";
import { db } from "@/lib/firebase-db";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { mealImages } from "@/lib/imageMealsMap";

const screenHeight = Dimensions.get("window").height;
const screenWidth = Dimensions.get("window").width;

const TabsIndexScreen = () => {
  const { user } = useSession();
  const uid = user?.uid;

  const [nutrition, setNutrition] = useState(null);
  const [meals, setMeals] = useState([]);

  // Fetch UserNutrition
  const fetchNutrition = async () => {
    try {
      const ref = doc(db, "UserNutrition", uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setNutrition(snap.data());
      }
    } catch (err) {
      console.error("Error fetching nutrition:", err);
    }
  };

  // Fetch Meals
  const fetchMeals = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "Meals"));
      const fetched = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMeals(fetched);
    } catch (err) {
      console.error("Error fetching meals:", err);
    }
  };

  useEffect(() => {
    if (uid) {
      fetchNutrition();
      fetchMeals();
    }
  }, [uid]);

  const renderMealSection = (type, label, hour) => {
    const filteredMeals = meals.filter((m) => m.type === type);

    return (
      <View style={{ marginBottom: 30 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
          <Text style={{ color: "white", fontSize: 20, fontFamily: "InterBold" }}>{label}</Text>
          <Text style={{ color: "white", fontSize: 14, fontFamily: "InterRegular" }}>{hour}</Text>
        </View>
        <FlatList
          data={filteredMeals}
          horizontal
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={{ marginRight: 12 }}>
              <Image
                source={mealImages[item.picture]}
                style={{ width: 140, height: 140, borderRadius: 10 }}
              />
              <Text style={{ color: "#FACC15", fontFamily: "InterBold", marginTop: 6 }}>
                {item.name}
              </Text>
              <Text style={{ color: "#ccc", fontFamily: "InterRegular" }}>
                {item.calories || "180"} Kcal
              </Text>
            </View>
          )}
        />
      </View>
    );
  };

  return (
    <>
      <ImageBackground
        source={require("@/assets/images/background.png")}
        style={[styles.backgroundImage, { width: screenWidth, height: screenHeight }]}
        resizeMode="cover"
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 25, paddingTop: 122, paddingBottom: 82 }}>
        <Text className="text-2xl font-[InterBold] text-center text-white mb-6">Calorie intake of the day</Text>
        <Text className="text-base font-[InterRegular] text-center text-[#B4B4B4] mb-6">Select the meals you eat for breakfast, lunch, your protein snack, and dinner to easily estimate your daily intake of calories, carbs, fats, and proteins.</Text>

        {/* Nutrition Panel */}
        {nutrition && (
          <View style={{ backgroundColor: "#000000aa", padding: 16, borderRadius: 16, marginBottom: 30 }}>
            <Text style={{ color: "#fff", fontSize: 16, fontFamily: "InterBold", marginBottom: 10 }}>
              Calorie intake of the day
            </Text>
            <Text style={{ color: "#ccc", fontSize: 13, fontFamily: "InterRegular", marginBottom: 10 }}>
              Your daily goals are based on your fitness objective, using the Mifflin-St Jeor Equation.
            </Text>

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: "#FACC15", fontSize: 28, fontWeight: "bold" }}>
                {nutrition.Calories} kcal
              </Text>
              <View>
                <Text style={{ color: "#fff" }}>Carbs: {nutrition.Carbs}g</Text>
                <Text style={{ color: "#fff" }}>Protein: {nutrition.Protein}g</Text>
                <Text style={{ color: "#fff" }}>Fat: {nutrition.Fat}g</Text>
              </View>
            </View>
          </View>
        )}

        {/* Meal Sections */}
        {renderMealSection("breakfast", "Breakfast", "8:00 AM")}
        {renderMealSection("lunch", "Lunch", "12:30 PM")}
        {renderMealSection("protein", "Protein Snack", "4:00 PM")}
        {renderMealSection("dinner", "Dinner", "7:30 PM")}
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
  },
});

export default TabsIndexScreen;
