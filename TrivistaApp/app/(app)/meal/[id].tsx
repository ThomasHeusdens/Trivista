/**
 * Displays a meal detail page allowing users to customize and save their meal.
 */
import { useSession } from "@/context";
import { db } from "@/lib/firebase-db";
import { mealImages } from "@/lib/imageMealsMap";
import { AntDesign } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import CustomAlert from "@/components/CustomAlert";
import {
  Dimensions,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Checkbox } from "react-native-paper";

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

/**
 * Fetches and displays the meal detail page.
 */
const MealDetail = () => {
  const params = useLocalSearchParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const type = typeof params.type === 'string' ? params.type : '';
  
  const { user } = useSession();
  const router = useRouter();

  const [meal, setMeal] = useState(null);
  const [ingredients, setIngredients] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  /**
   * Fetches meal and ingredient data from Firestore.
   */
  useEffect(() => {
    const fetchMeal = async () => {
      try {
        if (!id) {
          console.error("No meal ID provided");
          setIsLoading(false);
          return;
        }
        
        const mealRef = doc(db, "Meals", id);
        const mealSnap = await getDoc(mealRef);
        if (mealSnap.exists()) {
          const mealData = mealSnap.data();
          setMeal(mealData);
        } else {
          console.error("Meal not found");
        }
      } catch (error) {
        console.error("Error fetching meal:", error);
      }
    };

    const fetchIngredients = async () => {
      try {
        const snap = await getDocs(collection(db, "Ingredients"));
        const result = {};
        snap.forEach((doc) => {
          result[doc.id] = doc.data();
        });
        setIngredients(result);
      } catch (error) {
        console.error("Error fetching ingredients:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeal();
    fetchIngredients();
  }, [id]);

  /**
   * Toggles all instances of an ingredient on or off.
   * @param {string} id - Ingredient ID
   * @param {number} totalCount - Total occurrences in the meal
   */
  const toggleAll = (id, totalCount) => {
    const currentCount = selectedIds.filter((i) => i === id).length;

    setSelectedIds((prev) => {
      if (currentCount > 0) {
        return prev.filter((i) => i !== id);
      } else {
        return [...prev, ...Array(totalCount).fill(id)];
      }
    });
  };

  /**
   * Adds one occurrence of an ingredient.
   * @param {string} id - Ingredient ID
   */
  const increment = (id) => {
    setSelectedIds((prev) => [...prev, id]);
  };

  /**
   * Removes one occurrence of an ingredient.
   * @param {string} id - Ingredient ID
   */
  const decrement = (id) => {
    const idx = selectedIds.lastIndexOf(id);
    if (idx !== -1) {
      const copy = [...selectedIds]; 
      copy.splice(idx, 1);
      setSelectedIds(copy);
    }
  };

  /**
   * Calculates total for a given macro based on selected ingredients.
   * @param {string} macro - 'calorie' | 'carbs' | 'proteins' | 'fat'
   * @returns {number}
   */
  const computeMacro = (macro) => {
    return selectedIds.reduce((total, id) => total + (ingredients[id]?.[macro] || 0), 0);
  };

  /**
   * Saves the customized meal to Firestore.
   */
  const handleSave = async () => {    
    if (selectedIds.length === 0) {
      setAlertTitle("Error");
      setAlertMessage("Please select at least one ingredient.");
      setAlertVisible(true);
      return;
    }

    try { 
      setButtonLoading(true);
      const docId = `${user.uid}_${type}`;
      await setDoc(doc(db, "UserMeals", docId), {
        ingredients: selectedIds,
        timestamp: new Date(),
        mealId: id,
        mealType: type,
        userId: user.uid,
      });
      
      router.back();
    } catch (err) {
      setButtonLoading(false);
      setAlertTitle("Error");
      setAlertMessage(`Failed to save meal: ${err.message}`);
      setAlertVisible(true);
    }
  };

  if (isLoading || !meal || Object.keys(ingredients).length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1E1E1E" }}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  const totalCalories = Math.round(computeMacro("calorie"));
  const totalCarbs = Math.round(computeMacro("carbs"));
  const totalProtein = Math.round(computeMacro("proteins"));
  const totalFat = Math.round(computeMacro("fat"));

  const ingredientCounts = meal.ingredients.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});

  const extraIngredients = Object.keys(ingredients).filter((id) => !ingredientCounts[id]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ImageBackground
          source={mealImages[meal.picture]}
          style={styles.image}
          resizeMode="cover"
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <AntDesign name="arrowleft" size={28} color="#1e1e1e" />
          </TouchableOpacity>
          <LinearGradient
            colors={["#1E1E1E", "transparent"]}
            start={{ x: 0.5, y: 1 }}
            end={{ x: 0.5, y: 0 }}
            style={styles.titleOverlay}
          >
            <Text style={styles.mealName} numberOfLines={1} ellipsizeMode="tail">
              {meal.name}
            </Text>
          </LinearGradient>
        </ImageBackground>

        <Text style={styles.macrosTitle}>Food Summary</Text>
        <View style={styles.macroWrapper}>
          <MacroBox label="Kcal" value={totalCalories} colorMacro="#FACC15" colorValue="rgba(255,255,255,0.15)" />
          <MacroBox label="Carbs" value={`${totalCarbs}g`} colorMacro="#FF8C00" colorValue="rgba(255,255,255,0.15)" />
          <MacroBox label="Protein" value={`${totalProtein}g`} colorMacro="#22C55E" colorValue="rgba(255,255,255,0.15)" />
          <MacroBox label="Fat" value={`${totalFat}g`} colorMacro="#3B82F6" colorValue="rgba(255,255,255,0.15)" />
        </View>

        <Text style={styles.ingredientTitle}>Ingredients</Text>
        <View style={{ paddingHorizontal: 20 }}>
          {Object.entries(ingredientCounts).map(([id, count]) => {
            const selectedCount = selectedIds.filter((i) => i === id).length;

            return (
              <View key={id} style={styles.checkboxRow}>
                <Checkbox
                  status={selectedCount > 0 ? "checked" : "unchecked"}
                  onPress={() => toggleAll(id, count)}
                  color="#FACC15"
                  uncheckedColor="#FACC15"
                />
                <Text style={styles.ingredientText}>
                  {ingredients[id]?.name || "Unknown"} ({count})
                </Text>
                <View style={styles.counterWrapper}>
                  <TouchableOpacity 
                    onPress={() => decrement(id)} 
                    style={styles.counterButton}
                    disabled={selectedCount === 0}
                  >
                    <Text style={[
                      styles.counterSymbol, 
                      selectedCount === 0 ? {color: '#666'} : {color: 'white'}
                    ]}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterNumber}>{selectedCount}</Text>
                  <TouchableOpacity onPress={() => increment(id)} style={styles.counterButton}>
                    <Text style={styles.counterSymbol}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {extraIngredients.length > 0 && (
          <>
            <Text style={styles.ingredientTitle}>Extra Ingredients</Text>
            <View style={{ paddingHorizontal: 20, paddingBottom: 100 }}>
              {extraIngredients.map((id) => {
                const selectedCount = selectedIds.filter((i) => i === id).length;
                return (
                  <View key={id} style={styles.checkboxRow}>
                    <Checkbox
                      status={selectedCount > 0 ? "checked" : "unchecked"}
                      onPress={() => toggleAll(id, 1)}
                      color="#FACC15"
                      uncheckedColor="#FACC15"
                    />
                    <Text style={styles.ingredientText}>
                      {ingredients[id]?.name || "Unknown"}
                    </Text>
                    <View style={styles.counterWrapper}>
                      <TouchableOpacity 
                        onPress={() => decrement(id)} 
                        style={styles.counterButton}
                        disabled={selectedCount === 0}
                      >
                        <Text style={[
                          styles.counterSymbol, 
                          selectedCount === 0 ? {color: '#666'} : {color: 'white'}
                        ]}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.counterNumber}>{selectedCount}</Text>
                      <TouchableOpacity onPress={() => increment(id)} style={styles.counterButton}>
                        <Text style={styles.counterSymbol}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {buttonLoading ? (
        <View style={[
            styles.saveButton,
          ]}>
          <ActivityIndicator size="small" color="#1E1E1E" />
        </View>
      ) : (
        <TouchableOpacity 
          style={[
            styles.saveButton,
            selectedIds.length === 0 && styles.saveButtonDisabled
          ]} 
          onPress={handleSave}
          disabled={selectedIds.length === 0}
        >
          <Text style={styles.saveButtonText}>
            Save Meal {selectedIds.length > 0 ? `(${selectedIds.length} items)` : ''}
          </Text>
        </TouchableOpacity>
      )}
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
};

/**
 * Displays a colored macro info box.
 * @param {string} label
 * @param {string | number} value
 * @param {string} colorMacro
 * @param {string} colorValue
 * @returns {JSX.Element}
 */
const MacroBox = ({ label, value, colorMacro, colorValue }) => (
  <View style={styles.macroBoxContainer}>
    <View style={[styles.macroBoxTop, { backgroundColor: colorMacro }]}>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>  
    <View style={[styles.macroBoxBottom, { backgroundColor: colorValue }]}>
      <Text style={styles.macroValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1E1E1E",
  },
  scrollView: {
    flex: 1,
  },
  image: {
    width: screenWidth,
    height: screenHeight * 0.25,
    justifyContent: "flex-end",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: "#FFCA15",
    padding: 10,
    borderRadius: 10,
  },
    titleOverlay: {
    width: "100%",
    padding: 25,
    position: "absolute",
    bottom: 0,
  },
  mealName: {
    color: "white",
    fontSize: 22,
    fontFamily: "InterBold",
  },
  macroWrapper: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
    marginHorizontal: 10,
  },
  macroBoxContainer: {
    width: 70,
    overflow: 'hidden',
    borderRadius: 10,
  },
  macroBoxTop: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    padding: 10,
    alignItems: 'center',
    width: '100%', 
  },
  macroBoxBottom: {
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    padding: 10,
    alignItems: 'center',
    width: '100%', 
  },
  macroLabel: {
    fontSize: 13,
    color: "white",
    fontFamily: "InterRegular",
    textAlign: 'center', 
  },
  macroValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    textAlign: 'center', 
  },
  ingredientTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: "InterBold",
    marginHorizontal: 25,
    marginTop: 15,
    marginBottom: 10,
  },
  macrosTitle: {
    color: "white",
    fontSize: 18,
    fontFamily: "InterBold",
    marginHorizontal: 25,
    marginTop: 25,
    marginBottom: 0,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  ingredientText: {
    color: "white",
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  counterWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 5,
    marginRight: 5,
  },
  counterButton: {
    paddingHorizontal: 8,
  },
  counterSymbol: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  counterNumber: {
    color: "#FACC15",
    fontSize: 14,
    marginHorizontal: 6,
    minWidth: 20,
    textAlign: "center",
  },
  saveButton: {
    position: "absolute",
    bottom: 20,
    left: 25,
    right: 25,
    backgroundColor: "#FACC15",
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#FACC15",
    opacity: 0.5,
  },
  saveButtonText: {
    color: "#1E1E1E",
    fontSize: 20,
    letterSpacing: 1.5,
    fontFamily: "Bison",
  },
});

export default MealDetail;