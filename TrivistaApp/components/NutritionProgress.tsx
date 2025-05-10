/**
 * NutritionProgress Component
 *
 * Displays a visual summary of the user's calorie and macronutrient intake for the day.
 * Fetches data from Firestore based on user's UID and totals the macros across all saved meals.
 *
 * Props:
 * - data: An object containing the user's daily macro goals (Calories, Carbs, Protein, Fat)
 */
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useSession } from "@/context";
import { db } from "@/lib/firebase-db";
import { collection, query, where, getDocs } from "firebase/firestore";

const NutritionProgress = ({ data }) => {
  const { user } = useSession();
  const [macrosTotal, setMacrosTotal] = useState({
    calorie: 0,
    carbs: 0,
    proteins: 0,
    fat: 0,
  });

  useEffect(() => {
    const fetchMacros = async () => {
      try {
        if (!user) return;

        const q = query(collection(db, "UserMeals"), where("userId", "==", user.uid));
        const snap = await getDocs(q);

        const ingredientCounts = {};
        snap.forEach((docSnap) => {
          const data = docSnap.data();
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

  const totalCalories = Math.round(data?.Calories || 1);
  const consumedCalories = Math.round(macrosTotal.calorie);
  const caloriesProgress = consumedCalories / totalCalories;

  const roundedCarbs = Math.round(macrosTotal.carbs);
  const roundedProteins = Math.round(macrosTotal.proteins);
  const roundedFat = Math.round(macrosTotal.fat);

  const macros = [
    { label: "Carbs", consumed: roundedCarbs, total: data?.Carbs || 170, color: "#FF2C2C" },
    { label: "Protein", consumed: roundedProteins, total: data?.Protein || 70, color: "#22C55E" },
    { label: "Fat", consumed: roundedFat, total: data?.Fat || 35, color: "#3B82F6" },
  ];

  return (
    <View style={styles.wrapper}>
      {/* Donut Chart */}
      <View style={styles.circleContainer}>
        <Svg width={140} height={140}>
          <Circle stroke="#B4B4B4" cx="70" cy="70" r={60} strokeWidth={10} fill="none" />
          <Circle
            stroke="#FACC15"
            cx="70"
            cy="70"
            r={60}
            strokeWidth={10}
            fill="none"
            strokeDasharray={2 * Math.PI * 60}
            strokeDashoffset={2 * Math.PI * 60 * (1 - caloriesProgress)}
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
          return (
            <View key={macro.label} style={{ marginBottom: 12 }}>
              <View style={styles.macroRow}>
                <Text style={styles.macroLabel}>{macro.label}</Text>
                <Text style={styles.macroValue}>{macro.consumed}/{macro.total}g</Text>
              </View>
              <View style={styles.barBackground}>
                <View
                  style={{
                    width: `${Math.min(percent * 100, 100)}%`,
                    backgroundColor: macro.color,
                    height: 6,
                    borderRadius: 6,
                  }}
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