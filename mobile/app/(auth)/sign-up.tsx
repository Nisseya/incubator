import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../auth/AuthContext";

export default function SignUpScreen() {
  const { signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit() {
    try {
      await signUp(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("Sign up", String(e?.message ?? e));
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password (min 8 chars)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={styles.primaryBtn} onPress={onSubmit}>
        <Text style={styles.primaryText}>Create account</Text>
      </Pressable>

      <Pressable style={styles.linkBtn} onPress={() => router.back()}>
        <Text style={styles.linkText}>Back to sign in</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", gap: 12 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16 },
  primaryBtn: { backgroundColor: "black", padding: 12, borderRadius: 10, alignItems: "center" },
  primaryText: { color: "white", fontWeight: "700", fontSize: 16 },
  linkBtn: { alignItems: "center", padding: 10 },
  linkText: { textDecorationLine: "underline", fontSize: 16 },
});
