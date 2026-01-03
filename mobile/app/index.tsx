import { Redirect } from "expo-router";
import { useAuth } from "../auth/AuthContext";

export default function Index() {
  const { accessToken, isLoading } = useAuth();

  if (isLoading) return null;

  return <Redirect href={accessToken ? "/(tabs)" : "/(auth)/sign-in"} />;
}
