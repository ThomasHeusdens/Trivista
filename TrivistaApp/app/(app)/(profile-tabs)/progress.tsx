import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  Pressable, 
  ImageBackground, 
  StyleSheet, 
  Dimensions,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
  ScrollView,
  ActivityIndicator
} from "react-native";
import { Picker } from '@react-native-picker/picker';
import { LineChart } from 'react-native-chart-kit';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { getAuth } from "firebase/auth";
import { db } from "@/lib/firebase-db";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface TrainingSession {
  id: string;
  userId: string;
  name: string;
  type: string;
  feeling: string;
  time: number;
  distance: string;
  pace: number;
  coords: any;
  createdAt: string;
  city: string;
}

const typeOptions = [
  { label: "Running", value: "run" },
  { label: "Cycling", value: "bike" },
  { label: "Swimming", value: "swim" },
];

const goalByType = {
  run: 5,
  bike: 20,
  swim: 0.75
};

const Progress = () => {
  const [selectedType, setSelectedType] = useState("run");
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any>(null);
  const goalProgress = useSharedValue(0);

  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      prepareChartData();
    }
  }, [sessions, selectedType]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const user = getAuth().currentUser;
      if (!user) return;
      
      const q = query(
        collection(db, "users", user.uid, "trainingSessions"),
        orderBy("timestamp", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const sessionsData: TrainingSession[] = [];
      
      querySnapshot.forEach((doc) => {
        sessionsData.push({
          id: doc.id,
          ...doc.data()
        } as TrainingSession);
      });
      
      setSessions(sessionsData);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    let filteredSessions = sessions;
    
    if (selectedType !== "all") {
      filteredSessions = sessions.filter(session => session.type === selectedType);
    }

    if (filteredSessions.length === 0) {
      const goalDistance = goalByType[selectedType];
      goalProgress.value = withTiming(0, { duration: 800 }); 
      setChartData(null);
      return;
    }

    const sortedSessions = [...filteredSessions].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const distances = sortedSessions.map(session => parseFloat(session.distance));
    const labels = sortedSessions.map((_, index) => `S${index + 1}`); 

    const defaultMaxValues = {
      run: 5,
      bike: 20,
      swim: 0.750
    };

    const maxDataValue = Math.max(...distances);
    const defaultMax = defaultMaxValues[selectedType] || 5;
    const yAxisMax = Math.max(maxDataValue, defaultMax);

    let chartData, chartLabels;
    if (distances.length === 1) {
      chartData = [0, distances[0], 0];
      chartLabels = ["", labels[0], ""];
    } else {
      if (distances.length > 10) {
        const latestSessions = sortedSessions.slice(-10);
        chartData = latestSessions.map(session => parseFloat(session.distance));
        chartLabels = latestSessions.map((_, index) => `S${sortedSessions.length - 9 + index}`);
      } else {
        chartData = distances;
        chartLabels = labels;
      }
    }

    const totalDistance = distances.reduce((sum, dist) => sum + dist, 0);
    const avgDistance = totalDistance / distances.length;
    const maxDistance = Math.max(...distances);
    const goalDistance = goalByType[selectedType];
    const progressRatio = Math.min(maxDistance / goalDistance, 1);
    goalProgress.value = withTiming(progressRatio, { duration: 800 });
    const improvement = distances.length > 1 ? 
      ((distances[distances.length - 1] - distances[0]) / distances[0] * 100) : 0;
    const feelings = sortedSessions.map(session => session.feeling);
    const feelingLevels = { Easy: 1, Moderate: 2, Hard: 3, Max: 4 };
    const reverseFeelingLevels = ['Easy', 'Moderate', 'Hard', 'Max'];

    const avgFeelingNumeric = feelings
      .map(f => feelingLevels[f])
      .filter(Boolean);

    const avgFeelingValue = avgFeelingNumeric.length > 0
      ? reverseFeelingLevels[Math.round(avgFeelingNumeric.reduce((a, b) => a + b, 0) / avgFeelingNumeric.length) - 1]
      : 'N/A';
  

    setChartData({
      labels: chartLabels,
      datasets: [{
        data: chartData,
        color: (opacity = 1) => `rgba(250, 204, 21, ${opacity})`,
        strokeWidth: 3
      }],
      yAxisMax: yAxisMax,
      isSinglePoint: distances.length === 1,
      stats: {
        total: totalDistance.toFixed(2),
        average: avgDistance.toFixed(2),
        max: maxDistance.toFixed(2),
        improvement: improvement.toFixed(1),
        sessionCount: sortedSessions.length,
        averageFeeling: avgFeelingValue,
        bestPace: Math.min(...sortedSessions.map(s => s.pace || Infinity)).toFixed(2),
      }
    });
  };

  const getChartConfig = (yAxisMax, isSinglePoint = false) => ({
    backgroundColor: "transparent",
    backgroundGradientFrom: "rgba(30, 30, 30, 0.8)",
    backgroundGradientTo: "rgba(30, 30, 30, 0.4)",
    backgroundGradientFromOpacity: 0.8,
    backgroundGradientToOpacity: 0.4,
    color: (opacity = 1) => `rgba(250, 204, 21, ${opacity})`,
    strokeWidth: 3,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForDots: {
      r: isSinglePoint ? "6" : "5",
      strokeWidth: isSinglePoint ? "3" : "2",
      stroke: "#FACC15",
      fill: "#FACC15",
      fillOpacity: 0.8,
    },
    propsForBackgroundLines: {
      strokeWidth: 1,
      stroke: "rgba(255, 255, 255, 0.1)",
      strokeDasharray: "5,5",
    },
    propsForLabels: {
      fontSize: 12,
      fontFamily: "InterRegular",
      fill: "white",
    },
    decimalPlaces: selectedType === 'swim' ? 3 : 1,
    style: {
      borderRadius: 16,
    },
    yAxisSuffix: '',
    yAxisInterval: 1,
    fromZero: true,
    segments: 4,
    formatYLabel: (value) => {
      const numValue = parseFloat(value);
      if (selectedType === 'swim') {
        return numValue.toFixed(3);
      }
      return numValue.toFixed(1);
    },
    yAxisMax: yAxisMax,
  });

  const animatedGoalBarStyle = useAnimatedStyle(() => ({
    width: `${Math.min(goalProgress.value * 100, 100)}%`,
  }));

  const getImprovementStatus = (improvementValue) => {
    const improvement = parseFloat(improvementValue);
    
    if (isNaN(improvement)) {
      return {
        color: '#FFFFFF',
        backgroundColor: 'rgba(107, 114, 128, 0.2)',
        icon: '➖',
        text: 'No improvement data yet'
      };
    }
    
    if (improvement === 0) {
      return {
        color: '#FFFFFF',
        backgroundColor: 'rgba(107, 114, 128, 0.2)',
        icon: '➖',
        text: '0% vs first session'
      };
    }
    
    if (improvement > 0) {
      return {
        color: '#22C55E',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        icon: '↗️',
        text: `${Math.abs(improvement)}% vs first session`
      };
    }
    
    return {
      color: '#EF4444',
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
      icon: '↘️',
      text: `${Math.abs(improvement)}% vs first session`
    };
  };

  const StatsCard = ({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) => (
    <View style={styles.statsCard}>
      <Text style={styles.statsTitle}>{title}</Text>
      <Text style={styles.statsValue}>{value}</Text>
      {subtitle && <Text style={styles.statsSubtitle}>{subtitle}</Text>}
    </View>
  );

  return (
    <>
      {/* Full screen background */}
      <ImageBackground
        source={require("@/assets/images/background.png")}
        style={[
          styles.backgroundImage,
          {
            width: screenWidth,
            height: screenHeight,
          }
        ]}
        resizeMode="cover"
      />
      
      {/* Content */}
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Progress Tracking</Text>
            <Text style={styles.headerSubtitle}>
              Tracking your progress is key to growth. See how you're improving, celebrate your best sessions, and stay motivated with real results.
            </Text>
          </View>

          {/* Filter */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              onPress={() => {
                if (Platform.OS === "ios") setTypeModalVisible(true);
              }}
              style={styles.filterButton}
            >
              {Platform.OS === "ios" ? (
                <Text style={styles.filterButtonText}>
                  {typeOptions.find((t) => t.value === selectedType)?.label || "Running"}
                </Text>
              ) : (
                <Picker
                  selectedValue={selectedType}
                  onValueChange={(itemValue) => setSelectedType(itemValue)}
                  style={{ color: "#fff", width: "100%" }}
                  dropdownIconColor="#FACC15"
                >
                  {typeOptions.map((opt) => (
                    <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                  ))}
                </Picker>
              )}
            </TouchableOpacity>
          </View>

          {/* Chart Section */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FACC15" />
              <Text style={styles.loadingText}>Loading your progress...</Text>
            </View>
          ) : chartData ? (
            <>
              <View style={{ marginBottom: 20 }}>
                {/* Labels above the bar */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                  <Text style={styles.goalLabel}>Best</Text>
                  {parseFloat(chartData.stats.max) >= goalByType[selectedType] && (
                    <Text style={styles.goalAchieved}>🎯 Goal Achieved</Text>
                  )}
                  <Text style={styles.goalLabel}>Goal</Text>
                </View>

                {/* Bar itself */}
                <View style={styles.dayBarContainer}>
                  <Animated.View style={[styles.dayBarFill, animatedGoalBarStyle]} />
                </View>

                {/* Numeric values below */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.goalValue}>{chartData.stats.max} km</Text>
                  <Text style={styles.goalValue}>{goalByType[selectedType]} km</Text>
                </View>
              </View>
              {/* Improvement Badge */}
              {chartData.stats.sessionCount > 1 && (() => {
                const status = getImprovementStatus(chartData.stats.improvement);
                return (
                  <View style={[
                    styles.improvementBadge, 
                    { backgroundColor: status.backgroundColor }
                  ]}>
                    <Text style={[
                      styles.improvementText,
                      { color: status.color }
                    ]}>
                      {status.icon} {status.text}
                    </Text>
                  </View>
                );
              })()}

              {/* Chart */}
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Distance Progression</Text>
                <LineChart
                  data={chartData}
                  width={screenWidth - 82}
                  height={220}
                  chartConfig={getChartConfig(chartData.yAxisMax, chartData.isSinglePoint)}
                  bezier={!chartData.isSinglePoint}
                  style={styles.chart}
                  withHorizontalLabels={true}
                  withVerticalLabels={true}
                  withInnerLines={true}
                  withOuterLines={false}
                  withShadow={false}
                  fromZero={true}
                  yAxisSuffix={selectedType === 'swim' ? ' km' : ' km'}
                  segments={4}
                />
                <Text style={styles.chartSubtitle}>
                  {chartData.isSinglePoint 
                    ? "Your single training session"
                    : "Each point represents a training session (oldest → newest)"
                  }
                </Text>
              </View>
              <Text style={styles.headerTitleSmall}>Key Highlights</Text>
              {/* Stats Cards */}
              <View style={styles.statsContainer}>
                <StatsCard 
                  title="Total Distance" 
                  value={`${chartData.stats.total} km`} 
                />
                <StatsCard 
                  title="Best Pace" 
                  value={`${chartData.stats.bestPace} min/km`} 
                />
                <StatsCard 
                  title="Average Distance" 
                  value={`${chartData.stats.average} km`} 
                />
                <StatsCard 
                  title="Average Feeling" 
                  value={chartData.stats.averageFeeling} 
                />
              </View>
            </>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataTitle}>No sessions found</Text>
              <Text style={styles.noDataText}>
                {
                  `No ${typeOptions.find(t => t.value === selectedType)?.label.toLowerCase()} sessions found.`
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* iOS Modal for Type Selection - Updated to match first file */}
      <Modal transparent animationType="fade" visible={typeModalVisible}>
        <TouchableOpacity
          onPress={() => setTypeModalVisible(false)}
          style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000000aa" }}
        >
          <View style={{ backgroundColor: "#1E1E1E", borderRadius: 10, width: "80%", borderWidth: 1, borderColor: "#FACC15" }}>
            <FlatList
              data={typeOptions}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedType(item.value);
                    setTypeModalVisible(false);
                  }}
                  style={{ padding: 15, borderBottomWidth: 1, borderBottomColor: "rgba(250, 204, 21, 0.3)" }}
                >
                  <Text style={{ fontSize: 16, color: "white", fontFamily: "InterRegular" }}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: -1,
    backgroundColor: "#1E1E1E",
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 25,
    paddingTop: 122,
    paddingBottom: 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    color: 'white',
    fontFamily: 'InterBold',
    marginBottom: 4,
  },
  headerTitleSmall: {
    fontSize: 20,
    color: 'white',
    fontFamily: 'InterBold',
    marginBottom: 12,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontFamily: 'InterRegular',
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  filterContainer: {
    marginBottom: 24,
  },
  filterButton: {
    borderWidth: 1,
    borderColor: "#FACC15",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.1)",
    width: "100%",
    height: Platform.OS === "ios" ? 50 : 50,
    justifyContent: "center",
  },
  filterButtonText: {
    color: "white",
    padding: 12,
    fontFamily: "InterRegular",
    textAlign: "center",
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
  },
  statsTitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
  statsValue: {
    color: '#FACC15',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsSubtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    marginTop: 2,
  },
  improvementBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  improvementText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chartContainer: {
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderWidth: 1,
    borderColor: "#FACC15",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  chartTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  chartSubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.3)',
    borderRadius: 16,
  },
  noDataTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noDataText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    textAlign: 'center',
  },
  dayBarContainer: {
  height: 10,
  width: "100%",
  backgroundColor: "#ccc",
  borderRadius: 10,
  overflow: "hidden",
  marginBottom: 8,
},
dayBarFill: {
  height: "100%",
  backgroundColor: "#FACC15",
  borderRadius: 10,
},
goalLabel: {
  fontSize: 14,
  color: 'rgba(255,255,255,0.7)',
  fontFamily: 'InterRegular',
},
goalValue: {
  fontSize: 12,
  color: 'white',
  fontFamily: 'InterBold',
},
goalAchieved: {
  fontSize: 14,
  color: '#22C55E',
  fontFamily: 'InterBold',
  textAlign: 'center',
},
});

export default Progress;