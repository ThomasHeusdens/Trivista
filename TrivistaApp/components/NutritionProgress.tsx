/**
 * Displays animated daily progress for calories and macronutrients.
 * Pulls meal data for the current user and computes daily totals.
 * Renders a donut chart for calories and animated bars for carbs, proteins, and fat.
 * @module
 */
import { useSession } from "@/context";
import { db } from "@/lib/firebase-db";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * NutritionProgress component
 *
 * Fetches and displays a user's daily nutritional intake compared to their goals.
 * Provides animated visualization for calorie and macronutrient consumption.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.data - Nutritional goal data containing Calories, Carbs, Protein, and Fat
 * @returns {React.JSX.Element} Rendered nutritional progress UI
 */
const NutritionProgress = ({ data }: { data: object; }): React.JSX.Element => {
  const { user } = useSession();
  const [macrosTotal, setMacrosTotal] = useState({
    calorie: 0,
    carbs: 0,
    proteins: 0,
    fat: 0,
  });

  const caloriesProgress = useSharedValue(0);
  const macroWidths = {
    carbs: useSharedValue(0),
    proteins: useSharedValue(0),
    fat: useSharedValue(0),
  };

  /**
   * Fetches user meal data for the current UTC day, aggregates macronutrient totals from ingredient data.
   */
  useEffect(() => {
    const fetchMacros = async () => {
      try {
        if (!user) return;

        const colRef = collection(db, "users", user.uid, "meals");
        const snap = await getDocs(colRef);

        const todayUTC = new Date();
        const todayYear = todayUTC.getUTCFullYear();
        const todayMonth = todayUTC.getUTCMonth();
        const todayDay = todayUTC.getUTCDate();

        const ingredientCounts = {};
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          if (!data.timestamp?.toDate) return;

          const savedDate = data.timestamp.toDate();
          const savedYear = savedDate.getUTCFullYear();
          const savedMonth = savedDate.getUTCMonth();
          const savedDay = savedDate.getUTCDate();

          const isSameUTCDate =
            savedYear === todayYear &&
            savedMonth === todayMonth &&
            savedDay === todayDay;

          if (!isSameUTCDate) return;

          (data.ingredients || []).forEach((id) => {
            ingredientCounts[id] = (ingredientCounts[id] || 0) + 1;
          });
        });

        const ingSnapshot = await getDocs(collection(db, "Ingredients"));
        const allIngredients = {};
        ingSnapshot.forEach((doc) => {
          allIngredients[doc.id] = doc.data();
        });

        const total = { calorie: 0, carbs: 0, proteins: 0, fat: 0 };
        for (const [id, count] of Object.entries(ingredientCounts)) {
          const ing = allIngredients[id];
          if (!ing) continue;
          total.calorie += (ing.calorie || 0) * count;
          total.carbs += (ing.carbs || 0) * count;
          total.proteins += (ing.proteins || 0) * count;
          total.fat += (ing.fat || 0) * count;
        }

        setMacrosTotal(total);
      } catch (err) {
        console.error("Error loading macros:", err);
      }
    };

    fetchMacros();
  }, [user]);

  /**
   * Updates animated calorie donut and macro bars based on fetched data.
   */
  useEffect(() => {
    const totalCalories = Math.round(data?.Calories || 1);
    const consumedCalories = Math.round(macrosTotal.calorie);
    caloriesProgress.value = withTiming(Math.min(consumedCalories / totalCalories, 1), {
      duration: 800,
    });

    const updateMacro = (key, total, consumed) => {
      const percent = Math.min(consumed / total, 1);
      macroWidths[key].value = withTiming(percent, { duration: 800 });
    };

    updateMacro("carbs", data?.Carbs || 170, macrosTotal.carbs);
    updateMacro("proteins", data?.Protein || 70, macrosTotal.proteins);
    updateMacro("fat", data?.Fat || 35, macrosTotal.fat);
  }, [macrosTotal, data]);

  const animatedProps = useAnimatedProps(() => {
    const circleLength = 2 * Math.PI * 60;
    return {
      strokeDashoffset: circleLength * (1 - caloriesProgress.value),
    };
  });

  const totalCalories = Math.round(data?.Calories || 1);
  const consumedCalories = Math.round(macrosTotal.calorie);

  const macros = [
    {
      label: "Carbs",
      consumed: Math.round(macrosTotal.carbs),
      total: data?.Carbs || 170,
      color: "#FF8C00",
      key: "carbs",
    },
    {
      label: "Protein",
      consumed: Math.round(macrosTotal.proteins),
      total: data?.Protein || 70,
      color: "#22C55E",
      key: "proteins",
    },
    {
      label: "Fat",
      consumed: Math.round(macrosTotal.fat),
      total: data?.Fat || 35,
      color: "#3B82F6",
      key: "fat",
    },
  ];

  const animatedMacroStyles = {
    carbs: useAnimatedStyle(() => ({
      width: `${Math.min(macroWidths.carbs.value * 100, 100)}%`,
    })),
    proteins: useAnimatedStyle(() => ({
      width: `${Math.min(macroWidths.proteins.value * 100, 100)}%`,
    })),
    fat: useAnimatedStyle(() => ({
      width: `${Math.min(macroWidths.fat.value * 100, 100)}%`,
    })),
  };

  return (
    <View style={styles.wrapper}>
      {/* Donut Chart */}
      <View style={styles.circleContainer}>
        <Svg width={140} height={140}>
          <Circle stroke="#B4B4B4" cx="70" cy="70" r={60} strokeWidth={10} fill="none" />
          <AnimatedCircle
            stroke={consumedCalories > totalCalories ? "#FF4444" : "#FACC15"}
            cx="70"
            cy="70"
            r={60}
            strokeWidth={10}
            fill="none"
            strokeDasharray={2 * Math.PI * 60}
            animatedProps={animatedProps}
            strokeLinecap="round"
            rotation="-90"
            origin="70,70"
          />
        </Svg>
        <View style={styles.kcalText}>
          <Text style={styles.kcalNumber}>{consumedCalories}</Text>
          <Text style={styles.kcalTotal}>/{totalCalories}</Text>
          <Text style={styles.kcalLabel}>Kcal</Text>
        </View>
      </View>

      {/* Macro Bars */}
      <View style={{ flex: 1, marginLeft: 16 }}>
        {macros.map((macro) => {
          const percent = macro.consumed / macro.total;
          const isOver = percent > 1;

          return (
            <View key={macro.label} style={{ marginBottom: 12 }}>
              <View style={styles.macroRow}>
                <Text style={styles.macroLabel}>{macro.label}</Text>
                <Text style={styles.macroValue}>
                  {macro.consumed}/{macro.total}g
                </Text>
              </View>
              <View style={styles.barBackground}>
                <Animated.View
                  style={[
                    {
                      backgroundColor: isOver ? "#FF4444" : macro.color,
                      height: 6,
                      borderRadius: 6,
                    },
                    animatedMacroStyles[macro.key],
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    flexDirection: "row",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 30,
  },
  circleContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  kcalText: {
    position: "absolute",
    top: 42,
    alignItems: "center",
  },
  kcalNumber: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  kcalTotal: {
    color: "#ccc",
    fontSize: 13,
  },
  kcalLabel: {
    color: "#ccc",
    fontSize: 12,
    marginTop: 2,
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  macroLabel: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  macroValue: {
    color: "#ccc",
    fontSize: 13,
  },
  barBackground: {
    backgroundColor: "#B4B4B4",
    height: 6,
    borderRadius: 6,
    overflow: "hidden",
  },
});

export default NutritionProgress;