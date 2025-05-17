/**
 * Profile Tab Layout (Sessions, FAQ, Progress)
 *
 * Displays the secondary tab navigation for the user's profile section,
 * with custom top/bottom navigation and logout support.
 */
import { Tabs, router } from "expo-router";
import { TouchableOpacity, Text } from "react-native";
import { useSession } from "@/context";
import {
  Plus,
  BicepsFlexed,
  CircleHelp,
  ChartNoAxesCombined,
  LogOut,
} from "lucide-react-native";

/**
 * ProfileTabLayout()
 *
 * Renders a custom profile tab navigator with the user's name, a close button,
 * and a logout icon, along with three profile-related screens.
 *
 * @returns {JSX.Element} Profile tab navigation UI
 */
export default function ProfileTabLayout() {
  const { signOut, user } = useSession();
  const displayName = user?.displayName || "User";

  /**
   * handleLogout()
   *
   * Logs the user out and redirects to the sign-in screen.
   *
   * @returns {Promise<void>}
   */
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
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginLeft: 20, transform: [{ rotate: "-135deg" }] }}
          >
            <Plus color="white" size={40} />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 25 }}>
            <LogOut color="white" size={30} />
          </TouchableOpacity>
        ),
        tabBarStyle: {
          backgroundColor: "#1E1E1E", 
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
