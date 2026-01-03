import { useEffect } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../auth/AuthContext";

export default function HomeScreen() {
  const { user, loadMe, signOut } = useAuth();

  useEffect(() => {
    loadMe().catch((e) => Alert.alert("Me", String(e)));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Logged in ✅</Text>

      <Text style={styles.json}>
        {user ? JSON.stringify(user, null, 2) : "Loading user..."}
      </Text>

      <Pressable style={styles.btn} onPress={() => loadMe()}>
        <Text style={styles.btnText}>Reload /me</Text>
      </Pressable>

      <Pressable style={[styles.btn, styles.danger]} onPress={() => signOut()}>
        <Text style={styles.btnText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12, justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "700" },
  json: { fontFamily: "monospace", opacity: 0.8 },
  btn: { backgroundColor: "black", padding: 12, borderRadius: 10, alignItems: "center" },
  danger: { backgroundColor: "#7f1d1d" },
  btnText: { color: "white", fontWeight: "700" },
});
