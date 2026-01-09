import { useAuth } from "@/contexts/AuthContext";
import { useComparison } from "@/contexts/ComparisonContext";
import { Tabs, usePathname, useRouter } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import icons from "../../../constants/icons";
const TabIcon = ({
  focused,
  icon,
  title,
}: {
  focused: boolean;
  icon: any;
  title: string;
}) => (
  <View className="flex-1 mt-3 flex flex-col item-center">
    <Image
      source={icon}
      tintColor={focused ? "#0061ff" : "#666876"}
      resizeMode="contain"
      className="size-9"
    />
  </View>
);

const TabsLayout = () => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { comparisonList } = useComparison();
  const HIDDEN_ROUTES = ["/community/"];
  const isHidden = HIDDEN_ROUTES.some((route) => pathname.startsWith(route));
  const { user } = useAuth();
  const isComparisonActive = comparisonList.length > 0;

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          headerShown: false,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: "white",
            borderTopColor: "#0061FF1A",
            borderTopWidth: 1,
            minHeight: 70,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                icon={icons.home}
                focused={focused}
                title={t("tabs.home")}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="explore"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                icon={icons.search}
                focused={focused}
                title={t("tabs.explore")}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="market"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                icon={icons.chart}
                focused={focused}
                title={t("tabs.market")}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="services"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                icon={icons.localservice}
                focused={focused}
                title={t("tabs.services")}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                icon={icons.person}
                focused={focused}
                title={t("tabs.profile")}
              />
            ),
          }}
        />

        {/* Hidden screens but still inside tabs */}
        <Tabs.Screen name="create-property" options={{ href: null }} />
        <Tabs.Screen name="user-properties" options={{ href: null }} />
        <Tabs.Screen name="properties/[id]" options={{ href: null }} />
        <Tabs.Screen name="liked-properties" options={{ href: null }} />
        <Tabs.Screen name="edit-profile" options={{ href: null }} />
        <Tabs.Screen
          name="edit-property/[propertyId]"
          options={{ href: null }}
        />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="notification-settings" options={{ href: null }} />
        <Tabs.Screen name="security" options={{ href: null }} />
        <Tabs.Screen name="help-center" options={{ href: null }} />
        <Tabs.Screen name="blog/[id]" options={{ href: null }} />
        <Tabs.Screen name="feedback" options={{ href: null }} />
        <Tabs.Screen name="community" options={{ href: null }} />
        <Tabs.Screen name="news" options={{ href: null }} />
        <Tabs.Screen name="blog" options={{ href: null }} />
        <Tabs.Screen name="community/create" options={{ href: null }} />
        <Tabs.Screen name="community/post/[id]" options={{ href: null }} />
        <Tabs.Screen name="financialconsulting" options={{ href: null }} />
        <Tabs.Screen name="budget-calculator" options={{ href: null }} />
        <Tabs.Screen name="my-reports" options={{ href: null }} />
        <Tabs.Screen name="chats" options={{ href: null }} />
        <Tabs.Screen name="testimonials" options={{ href: null }} />
        <Tabs.Screen name="edit-preferences" options={{ href: null }} />
      </Tabs>

      {/* Floating Add Property Button - Hide when comparison is active OR on hidden routes */}
      {!isHidden &&
        !isComparisonActive &&
        (user?.role === "Admin" || user?.role === "Agent") && (
          <TouchableOpacity
            onPress={() => router.push("/(root)/create-property")}
            className="absolute bottom-24 right-6 bg-primary-300 w-16 h-16 rounded-full items-center justify-center shadow-2xl"
            style={{
              shadowColor: "#0061ff",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 5,
              elevation: 8,
            }}
            activeOpacity={0.8}
          >
            <Text className="text-white text-3xl font-light">+</Text>
          </TouchableOpacity>
        )}
    </>
  );
};

export default TabsLayout;
