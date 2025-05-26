/**
 * Displays the user's daily calorie and macronutrient goals along with interactive meal selection.
 * Retrieves nutritional targets and meals from Firestore, computes estimated intake,
 * and renders visual feedback through charts and meal cards.
 * @module
 */
import NutritionProgress from "@/components/NutritionProgress";
import { useSession } from "@/context";
import { db } from "@/lib/firebase-db";
import { useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import {
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import CustomAlert from "@/components/CustomAlert";

const screenHeight = Dimensions.get("window").height;
const screenWidth = Dimensions.get("window").width;

/**
 * Displays the main nutrition tracking interface.
 * Fetches user nutrition goals, meal data, and saved selections from Firestore.
 * Allows users to select meals and visually monitor their calorie and macro intake throughout the day.
 *
 * @returns {React.JSX.Element} The rendered nutrition tracking screen
 */
const Eat = (): React.JSX.Element => {
  const { user } = useSession();
  const uid = user?.uid;
  const router = useRouter();

  const [alertVisible, setAlertVisible] = useState(false);

  const [nutrition, setNutrition] = useState(null);
  const [meals, setMeals] = useState([]);
  const [ingredients, setIngredients] = useState({});
  const [savedMealsByType, setSavedMealsByType] = useState({});

  const [loading, setLoading] = useState(true);
  const [nutritionLoaded, setNutritionLoaded] = useState(false);
  const [mealsLoaded, setMealsLoaded] = useState(false);
  const [ingredientsLoaded, setIngredientsLoaded] = useState(false);
  const [savedMealsLoaded, setSavedMealsLoaded] = useState(false);

  /**
   * Fetches the authenticated user's daily calorie and macro targets from Firestore.
   *
   * @returns {Promise<void>}
   */
  const fetchNutrition = async (): Promise<void> => {
    try {
      if (!user) return;
      const ref = doc(db, "users", uid!, "nutrition", (user.displayName ? user.displayName : "nutrition"));
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setNutrition(snap.data());
      }
      setNutritionLoaded(true);
    } catch (err) {
      console.error("Error fetching nutrition:", err);
      setNutritionLoaded(true);
    }
  };


  /**
   * Fetches all available meals from Firestore and saves them to local state.
   *
   * @returns {Promise<void>}
   */
  const fetchMeals = async (): Promise<void> => {
    try {
      const querySnapshot = await getDocs(collection(db, "Meals"));
      const fetched = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMeals(fetched);
      setMealsLoaded(true);
    } catch (err) {
      console.error("Error fetching meals:", err);
      setMealsLoaded(true);
    }
  };

  /**
   * Fetches all ingredients from Firestore and stores them in a dictionary using their document IDs.
   *
   * @returns {Promise<void>}
   */
  const fetchIngredients = async (): Promise<void> => {
    try {
      const querySnapshot = await getDocs(collection(db, "Ingredients"));
      const result = {};
      querySnapshot.forEach((doc) => {
        result[doc.id] = doc.data();
      });
      setIngredients(result);
      setIngredientsLoaded(true);
    } catch (err) {
      console.error("Error fetching ingredients:", err);
      setIngredientsLoaded(true);
    }
  };

  /**
   * Fetches the user's saved meals and maps them by meal type.
   *
   * @returns {Promise<void>}
   */
  const fetchSavedMeals = async (): Promise<void> => {
    if (!uid) {
      setSavedMealsLoaded(true);
      return;
    }
    try {
      const colRef = collection(db, "users", uid, "meals");
      const snap = await getDocs(colRef);
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
      setSavedMealsLoaded(true);
    } catch (err) {
      console.error("Error fetching user meals:", err);
      setSavedMealsLoaded(true);
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
    if (uid && meals.length > 0 && !savedMealsLoaded) {
      fetchSavedMeals();
    }
  }, [uid, meals, savedMealsLoaded]);

  useEffect(() => {
    if (nutritionLoaded && mealsLoaded && ingredientsLoaded && 
        (savedMealsLoaded || meals.length === 0)) {
      setLoading(false);
    }
  }, [nutritionLoaded, mealsLoaded, ingredientsLoaded, savedMealsLoaded, meals]);


  /**
   * Computes the total macros (calories, carbs, proteins, fats) for a given meal.
   *
   * @param {Object} meal - Meal object containing an array of ingredient IDs.
   * @returns {Object} Object with total macro values.
   */
  const calculateMacros = (meal: object): object => {
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
   * @returns {React.JSX.Element}
   */
  const renderMealSection = (type: string, label: string, hour: string): React.JSX.Element => {
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
          <TouchableOpacity onPress={() => router.push({ pathname: `/meal/${meal.id}`, params: { type: meal.mealType } })}>
            <View style={{ backgroundColor: "rgba(255, 255, 255, 0.3)", borderBottomRightRadius: 10, borderTopRightRadius: 10, borderBottomLeftRadius: 60, borderTopLeftRadius: 60, padding: 0, flexDirection: "row", alignItems: "center" }}>
              <Image
                source={{uri: meal.picture}}
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
                    <Text style={{ color: "#FF8C00" }}>● </Text>
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
          </TouchableOpacity>
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
              <TouchableOpacity onPress={() => router.push({ pathname: `/meal/${item.id}`, params: { type } })}>
                <View style={{ backgroundColor: "rgba(255, 255, 255, 0.3)", padding: 14, borderRadius: 10, width: 200, alignItems: "center", height: 235}}>
                  <Image
                    source={{ uri: item.picture }}
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
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
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
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 25, paddingTop: 122, paddingBottom: 82 }}
      >
        <Text className="text-2xl font-[InterBold] text-center text-white mb-2">
          Calorie intake of the day
        </Text>
        <Text className="text-base font-[InterRegular] text-center text-[#B4B4B4] mb-9">
          Select the meals you eat for breakfast, lunch, your protein snack, and dinner to easily
          estimate your daily intake of calories, carbs, fats, and proteins.
        </Text>
        
        <TouchableOpacity onPress={() => setAlertVisible(true)}>
          {nutrition && <NutritionProgress data={nutrition} />}
        </TouchableOpacity>

        {renderMealSection("breakfast", "Breakfast", "8:00 AM")}
        {renderMealSection("lunch", "Lunch", "12:30 PM")}
        {renderMealSection("protein", "Protein Snack", "4:00 PM")}
        {renderMealSection("dinner", "Dinner", "7:30 PM")}
      </ScrollView>
      <CustomAlert
        visible={alertVisible}
        title={"Daily calorie intake"}
        message={
          "Your daily calories are calculated using the Mifflin-St Jeor Formula, a science-based method to estimate how much energy your body needs. We then adjust this based on your goal (lose, maintain, or gain weight) and split the result into 50% carbs, 25% protein, and 25% fat — just what your body needs to train effectively."
        }
        onClose={() => setAlertVisible(false)}
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
    backgroundColor: "#1E1E1E",
  },
});

export default Eat;