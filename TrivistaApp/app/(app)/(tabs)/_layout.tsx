/**
 * Layout component for the main authenticated sections of the app: Eat, Stretch, Train, and Recover.
 * Renders a customized header and bottom tab navigator with navigation actions and styling.
 * Includes a global alert for informational content accessed from the top-left icon.
 * @module
 */
import { Tabs } from "expo-router";
import { TouchableOpacity, Text } from "react-native";
import { useNavigation } from "expo-router";
import {
  BadgeInfo,
  CircleUser,
  Apple,
  Dumbbell,
  HeartHandshake,
} from "lucide-react-native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import StretchingIcon from "@/components/StretchingIcon";
import CustomAlert from "@/components/CustomAlert";
import { useInfoAlert } from "@/components/InfoAlertContext";

/**
 * Displays a custom top and bottom tab layout for the four main features of the app:
 * Eat, Stretch, Train, and Recover. Includes styled navigation icons and profile access.
 * Also renders a persistent informational alert modal triggered from the header.
 *
 * @returns {React.JSX.Element} Tab navigator with 4 primary tabs
 */
export default function TabLayout(): React.JSX.Element {
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const { infoVisible, setInfoVisible } = useInfoAlert();

  return (
    <>
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
            <TouchableOpacity
              onPress={() => setInfoVisible(true)}
              style={{ marginLeft: 25 }}
            >
              <BadgeInfo color="white" size={30} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate("(profile-tabs)")}
              style={{ marginRight: 25 }}
            >
              <CircleUser color="white" size={30} />
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
              <StretchingIcon size={28} color={color} />
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

      <CustomAlert
        visible={infoVisible}
        title="Why Trivista?"
        message={
          "Training for a triathlon can feel overwhelming — especially if you're starting from zero. But you don’t need to be an expert, or have hours a day to train.\n\n" +
          "Trivista is built to help you complete your first sprint triathlon in just 12 weeks. We guide you through every step: smart daily nutrition, focused training, effective stretching, and science-backed recovery — all in one intuitive app.\n\n" +
          "With personalized insights and routines designed for beginners, you'll build confidence, stay consistent, and make steady progress — without overthinking the process.\n\n" +
          "You train — we take care of the rest."
        }
        onClose={() => setInfoVisible(false)}
      />
    </>
  );
}