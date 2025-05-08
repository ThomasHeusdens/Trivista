/**
 * NutritionProgress Component
 *
 * Displays a visual summary of the user's calorie and macronutrient intake for the day.
 * Includes a donut-shaped calorie progress chart on the left and horizontal bars for carbs, protein, and fat on the right.
 *
 * Props:
 * - data: An object containing the user's total daily nutrition targets:
 *    {
 *      Calories: number,
 *      Carbs: number,
 *      Protein: number,
 *      Fat: number
 *    }
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";

/**
 * Uses react-native-svg to draw the calorie donut and fills it proportionally to calories consumed.
 * Macronutrients (carbs, protein, fat) are represented as colored bars with progress values.
 *
 * @param {Object} props - Component props
 * @param {Object} props.data - Nutrition targets (Calories, Carbs, Protein, Fat)
 * @returns {JSX.Element} Rendered nutrition UI
 */
const NutritionProgress = ({ data }) => {
  const radius = 60;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;

  const totalCalories = data?.Calories || "Error";
  const consumedCalories = 800; 
  const caloriesProgress = consumedCalories / totalCalories;

  const macros = [
    { label: "Carbs", consumed: 85, total: data?.Carbs || 170, color: "#FF2C2C" },
    { label: "Protein", consumed: 25, total: data?.Protein || 70, color: "#22C55E" },
    { label: "Fat", consumed: 11, total: data?.Fat || 35, color: "#3B82F6" },
  ];

  return (
    <View style={styles.wrapper}>
      {/* Circle Progress Left */}
      <View style={styles.circleContainer}>
        <Svg width={140} height={140}>
          <Circle
            stroke="#B4B4B4"
            cx="70"
            cy="70"
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            stroke="#FACC15"
            cx="70"
            cy="70"
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - caloriesProgress)}
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

      {/* Macros Right */}
      <View style={{ flex: 1, marginLeft: 16 }}>
        {macros.map((macro) => {
          const percent = macro.consumed / macro.total;
          // Render a labeled progress bar for each macro nutrient (carbs, protein, fat)
          return (
            <View key={macro.label} style={{ marginBottom: 12 }}>
              <View style={styles.macroRow}>
                <Text style={styles.macroLabel}>{macro.label}</Text>
                <Text style={styles.macroValue}>
                  {macro.consumed}/{macro.total}g
                </Text>
              </View>
              <View style={styles.barBackground}>
                <View
                  style={{
                    width: `${percent * 100}%`,
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