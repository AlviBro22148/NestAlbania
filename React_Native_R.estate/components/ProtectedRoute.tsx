import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth/sign-in");
    }

    if (!loading && requireAdmin && user?.role !== "Admin") {
      router.replace("/(tabs)/properties");
    }
  }, [isAuthenticated, loading, requireAdmin, user]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requireAdmin && user?.role !== "Admin") {
    return null;
  }

  return <>{children}</>;
}
