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
  Pressable,
} from "react-native";
import { useSession } from "@/context";
import { db } from "@/lib/firebase-db";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { mealImages } from "@/lib/imageMealsMap";
import NutritionProgress from "@/components/NutritionProgress"; 
import { useRouter } from "expo-router";

const screenHeight = Dimensions.get("window").height;
const screenWidth = Dimensions.get("window").width;

/**
 * Main component that displays user's daily nutrition goals
 * and allows meal selection and review for each meal type.
 */
const Eat = () => {
  const { user } = useSession();
  const uid = user?.uid;
  const router = useRouter();

  const [nutrition, setNutrition] = useState(null);
  const [meals, setMeals] = useState([]);
  const [ingredients, setIngredients] = useState({});
  const [savedMealsByType, setSavedMealsByType] = useState({});

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

  /**
   * Fetches the user's saved meals and maps them by meal type.
   *
   * @returns {Promise<void>}
   */
  const fetchSavedMeals = async () => {
    try {
      const q = query(collection(db, "UserMeals"), where("userId", "==", uid));
      const snap = await getDocs(q);
      const result = {};

      const todayUTC = new Date();
      const todayYear = todayUTC.getUTCFullYear();
      const todayMonth = todayUTC.getUTCMonth();
      const todayDay = todayUTC.getUTCDate();

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const found = meals.find((m) => m.id === data.mealId);

        if (found && data.mealType && data.timestamp?.toDate) {
          const savedDate = data.timestamp.toDate();
          const savedYear = savedDate.getUTCFullYear();
          const savedMonth = savedDate.getUTCMonth();
          const savedDay = savedDate.getUTCDate();

          const isSameUTCDate =
            savedYear === todayYear &&
            savedMonth === todayMonth &&
            savedDay === todayDay;

          if (isSameUTCDate) {
            result[data.mealType] = {
              ...found,
              ingredients: data.ingredients,
              mealType: data.mealType,
            };
          }
        }
      });

      setSavedMealsByType(result);
    } catch (err) {
      console.error("Error fetching user meals:", err);
    }
  };


  useEffect(() => {
    if (uid) {
      fetchNutrition();
      fetchMeals();
      fetchIngredients();
    }
  }, [uid]);

  useEffect(() => {
    if (uid && meals.length > 0) {
      fetchSavedMeals();
    }
  }, [uid, meals]);

  /**
   * Computes the total macros (calories, carbs, proteins, fats) for a given meal.
   *
   * @param {Object} meal - Meal object containing an array of ingredient IDs.
   * @returns {Object} Object with total macro values.
   */
  const calculateMacros = (meal) => {
    const macros = { calorie: 0, carbs: 0, proteins: 0, fat: 0 };
    if (!meal.ingredients || !ingredients) return macros;
    meal.ingredients.forEach((id) => {
      const ing = ingredients[id];
      if (ing) {
        macros.calorie += ing.calorie || 0;
        macros.carbs += ing.carbs || 0;
        macros.proteins += ing.proteins || 0;
        macros.fat += ing.fat || 0;
      }
    });
    return macros;
  };

  /**
   * Renders a section of meals for a specific type (e.g., breakfast, lunch).
   * If the meal was already selected by the user, it displays the saved meal instead.
   *
   * @param {string} type - Meal type (e.g., "breakfast").
   * @param {string} label - Section title (e.g., "Breakfast").
   * @param {string} hour - Suggested time for the meal.
   * @returns {JSX.Element}
   */
  const renderMealSection = (type, label, hour) => {
    if (savedMealsByType[type]) {
      const meal = savedMealsByType[type];
      const macros = calculateMacros(meal);
      const ingredientNames = meal.ingredients
        .map((id) => ingredients[id]?.name || "Unknown")
        .filter(Boolean);

      return (
        <View key={type} style={{ marginBottom: 30 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10, alignItems: "center" }}>
            <Text style={{ color: "white", fontSize: 20, fontFamily: "InterBold" }}>{label}</Text>
            <Text style={{ color: "#22C55E", fontSize: 14, fontFamily: "InterBold" }}>Done</Text>
          </View>
          <Pressable onPress={() => router.push({ pathname: `/meal/${meal.id}`, params: { type: meal.mealType } })}>
            <View style={{ backgroundColor: "rgba(255, 255, 255, 0.3)", borderBottomRightRadius: 10, borderTopRightRadius: 10, borderBottomLeftRadius: 60, borderTopLeftRadius: 60, padding: 0, flexDirection: "row", alignItems: "center" }}>
              <Image
                source={mealImages[meal.picture]}
                style={{ width: 120, height: 120, borderRadius: 60, marginRight: 16 }}
                resizeMode="cover"
              />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ color: "#FACC15", fontFamily: "InterBold", fontSize: 16, marginRight: 10 }}>
                  {meal.name}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                  <Text style={{ fontSize: 13 }}>
                    <Text style={{ color: "#FACC15" }}>● </Text>
                    <Text style={{ color: "white" }}>{Math.round(macros.calorie)}</Text>
                  </Text>
                  <Text style={{ fontSize: 13 }}>
                    <Text style={{ color: "#FF2C2C" }}>● </Text>
                    <Text style={{ color: "white" }}>{Math.round(macros.carbs)}g</Text>
                  </Text>
                  <Text style={{ fontSize: 13 }}>
                    <Text style={{ color: "#22C55E" }}>● </Text>
                    <Text style={{ color: "white" }}>{Math.round(macros.proteins)}g</Text>
                  </Text>
                  <Text style={{ fontSize: 13 }}>
                    <Text style={{ color: "#3B82F6" }}>● </Text>
                    <Text style={{ color: "white" }}>{Math.round(macros.fat)}g</Text>
                  </Text>
                </View>
                <Text numberOfLines={2} style={{ color: "#ccc", fontSize: 13, marginTop: 10, marginRight: 10 }}>
                  {ingredientNames.join(", ")}
                </Text>
              </View>
            </View>
          </Pressable>
        </View>
      );
    }

    const filteredMeals = meals.filter((m) => m.type === type);

    return (
      <View key={type} style={{ marginBottom: 30 }}>
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
            const totalKcal = calculateMacros(item).calorie;
            return (
              <Pressable onPress={() => router.push({ pathname: `/meal/${item.id}`, params: { type } })}>
                <View style={{ backgroundColor: "rgba(255, 255, 255, 0.3)", padding: 14, borderRadius: 10, width: 200, alignItems: "center" }}>
                  <Image
                    source={mealImages[item.picture]}
                    style={{ width: 140, height: 140, borderRadius: 70 }}
                    resizeMode="cover"
                  />
                  <Text
                    style={{ color: "#FACC15", fontFamily: "InterBold", marginTop: 8, fontSize: 14, textAlign: "center", flexWrap: "wrap" }}
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                  <Text style={{ color: "#ccc", fontFamily: "InterRegular", fontSize: 13, textAlign: "center" }}>
                    {Math.round(totalKcal)} Kcal
                  </Text>
                </View>
              </Pressable>
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

        {nutrition && <NutritionProgress data={nutrition} />}

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
    backgroundColor: "#1E1E1E",
  },
});

export default Eat;
