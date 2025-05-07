import { Tabs, router } from "expo-router";
import { Pressable, Text } from "react-native";
import { useSession } from "@/context";
import {
  Plus,
  BicepsFlexed,
  CircleHelp,
  ChartNoAxesCombined,
  LogOut,
} from "lucide-react-native";

export default function ProfileTabLayout() {
  const { signOut, user } = useSession();
  const displayName = user?.displayName || "User";

  const handleLogout = async () => {
    await signOut();
    router.replace("/sign-in");
  };

  return (
    <Tabs
      screenOptions={{
        headerTransparent: true,
        headerStyle: {
          backgroundColor: "#1E1E1E", 
          height: 100,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
        },
        headerTitleAlign: "center",
        headerTitle: () => (
          <Text
            style={{
              color: "#FACC15",
              fontFamily: "Bison",
              fontSize: 30,
            }}
          >
            {displayName}
          </Text>
        ),
        headerLeft: () => (
          <Pressable
            onPress={() => router.replace("/(app)/")}
            style={{ marginLeft: 20, transform: [{ rotate: "-135deg" }] }}
          >
            <Plus color="white" size={40} />
          </Pressable>
        ),
        headerRight: () => (
          <Pressable onPress={handleLogout} style={{ marginRight: 25 }}>
            <LogOut color="white" size={30} />
          </Pressable>
        ),
        tabBarStyle: {
          backgroundColor: "#1E1E1E", // ✅ make tab bar see-through
          height: 80,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: "absolute",
          overflow: "hidden",
          borderColor: "#1E1E1E",
        },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarActiveTintColor: "#FACC15",
        tabBarInactiveTintColor: "#FFFFFF",
        tabBarLabelStyle: {
          fontFamily: "Bison",
          fontSize: 11,
          letterSpacing: 1.5,
          marginTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="sessions"
        options={{
          title: "SESSIONS",
          tabBarIcon: ({ color }) => <BicepsFlexed color={color} size={30} />,
        }}
      />
      <Tabs.Screen
        name="faq"
        options={{
          title: "FAQ",
          tabBarIcon: ({ color }) => <CircleHelp color={color} size={30} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "PROGRESS",
          tabBarIcon: ({ color }) => (
            <ChartNoAxesCombined color={color} size={30} />
          ),
        }}
      />
    </Tabs>
  );
}
