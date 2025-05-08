/**
 * Eat screen
 * Displays daily calorie and macronutrient goals with meal selection to estimate intake.
 */
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
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
import NutritionProgress from "@/components/NutritionProgress"; 

const screenHeight = Dimensions.get("window").height;
const screenWidth = Dimensions.get("window").width;

const Eat = () => {
  const { user } = useSession();
  const uid = user?.uid;

  const [nutrition, setNutrition] = useState(null);
  const [meals, setMeals] = useState([]);
  const [ingredients, setIngredients] = useState({});

  /**
   * Fetches the authenticated user's daily calorie and macro targets from Firestore.
   *
   * @returns {Promise<void>}
   */
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

  /**
   * Fetches all available meals from Firestore and saves them to local state.
   *
   * @returns {Promise<void>}
   */
  const fetchMeals = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "Meals"));
      const fetched = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMeals(fetched);
    } catch (err) {
      console.error("Error fetching meals:", err);
    }
  };

  /**
   * Fetches all ingredients from Firestore and stores them in a dictionary using their document IDs.
   *
   * @returns {Promise<void>}
   */
  const fetchIngredients = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "Ingredients"));
      const result = {};
      querySnapshot.forEach((doc) => {
        result[doc.id] = doc.data();
      });
      setIngredients(result);
    } catch (err) {
      console.error("Error fetching ingredients:", err);
    }
  };

  useEffect(() => {
    if (uid) {
      fetchNutrition();
      fetchMeals();
      fetchIngredients();
    }
  }, [uid]);

  /**
   * Calculates the total calories for a meal based on its ingredient IDs.
   *
   * @param {object} meal - The meal object containing an array of ingredient IDs.
   * @returns {number} Total calorie count for the meal.
   */
  const calculateMealCalories = (meal) => {
    if (!meal.ingredients || !ingredients) return 0;

    return meal.ingredients.reduce((sum, id) => {
      const ing = ingredients[id];
      return sum + (ing?.calorie || 0);
    }, 0);
  };

  /**
   * Renders a scrollable section of meals for a given type (e.g., breakfast or lunch).
   *
   * @param {string} type - The category of meal (e.g., "breakfast").
   * @param {string} label - Display name for the section header.
   * @param {string} hour - Suggested meal time.
   * @returns {JSX.Element} Rendered FlatList of meals for the section.
   */
  const renderMealSection = (type, label, hour) => {
    const filteredMeals = meals.filter((m) => m.type === type);

    return (
      <View style={{ marginBottom: 30 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10, alignItems: "center" }}>
          <Text style={{ color: "white", fontSize: 20, fontFamily: "InterBold" }}>{label}</Text>
          <Text style={{ color: "white", fontSize: 14, fontFamily: "InterRegular" }}>{hour}</Text>
        </View>
        <FlatList
          data={filteredMeals}
          contentContainerStyle={{ gap: 15 }}
          horizontal
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const totalKcal = calculateMealCalories(item);
            return (
              <View
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.3)",
                  padding: 14,
                  borderRadius: 10,
                  width: 200,
                  alignItems: "center",
                }}
              >
                <Image
                  source={mealImages[item.picture]}
                  style={{ width: 140, height: 140, borderRadius: 70 }}
                  resizeMode="cover"
                />
                <Text
                  style={{
                    color: "#FACC15",
                    fontFamily: "InterBold",
                    marginTop: 8,
                    fontSize: 14,
                    textAlign: "center",
                    flexWrap: "wrap",
                  }}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
                <Text
                  style={{
                    color: "#ccc",
                    fontFamily: "InterRegular",
                    fontSize: 13,
                    textAlign: "center",
                  }}
                >
                  {totalKcal} Kcal
                </Text>
              </View>
            );
          }}
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
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 25, paddingTop: 122, paddingBottom: 82 }}
      >
        <Text className="text-2xl font-[InterBold] text-center text-white mb-6">
          Calorie intake of the day
        </Text>
        <Text className="text-base font-[InterRegular] text-center text-[#B4B4B4] mb-6">
          Select the meals you eat for breakfast, lunch, your protein snack, and dinner to easily
          estimate your daily intake of calories, carbs, fats, and proteins.
        </Text>

        {/* Nutrition Panel */}
        {nutrition && <NutritionProgress data={nutrition} />}

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

export default Eat;
