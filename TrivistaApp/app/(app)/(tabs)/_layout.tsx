import { Tabs } from "expo-router";
import { Pressable, Text } from "react-native";
import { useNavigation } from "expo-router";
import {
  BellRing,
  CircleUser,
  Apple,
  Dumbbell,
  HeartHandshake,
  StretchHorizontal,
} from "lucide-react-native";
import { DrawerNavigationProp } from "@react-navigation/drawer";

export default function TabLayout() {
  const navigation = useNavigation<DrawerNavigationProp<any>>();

  return (
    <Tabs
      screenOptions={{
        headerTransparent: true,
        headerTitleAlign: "center",
        headerStyle: {
          backgroundColor: "#1E1E1E",
          height: 100,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
        },
        headerTitle: () => (
          <Text
            style={{
              color: "#FACC15",
              fontFamily: "Sakana",
              fontSize: 30,
            }}
          >
            TRIVISTA
          </Text>
        ),
        headerLeft: () => (
          <Pressable style={{ marginLeft: 25 }}>
            <BellRing color="white" size={30} />
          </Pressable>
        ),
        headerRight: () => (
          <Pressable
            onPress={() => navigation.navigate("(profile-tabs)")}
            style={{ marginRight: 25 }}
          >
            <CircleUser color="white" size={30} />
          </Pressable>
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
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="eat"
        options={{
          title: "EAT",
          tabBarIcon: ({ color }) => <Apple color={color} size={28} />,
        }}
      />
      <Tabs.Screen
        name="stretch"
        options={{
          title: "STRETCH",
          tabBarIcon: ({ color }) => (
            <StretchHorizontal color={color} size={28} />
          ),
        }}
      />
      <Tabs.Screen
        name="train"
        options={{
          title: "TRAIN",
          tabBarIcon: ({ color }) => <Dumbbell color={color} size={28} />,
        }}
      />
      <Tabs.Screen
        name="recover"
        options={{
          title: "RECOVER",
          tabBarIcon: ({ color }) => (
            <HeartHandshake color={color} size={28} />
          ),
        }}
      />
    </Tabs>
  );
}