import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Link, router } from "expo-router";
import * as Google from "expo-auth-session/providers/google";
import { useAuth } from "../../auth/AuthContext";

export default function SignInScreen() {
  const { signIn, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const googleEnabled = useMemo(() => !!googleClientId, [googleClientId]);

  const [request, response, promptAsync] =
    Google.useIdTokenAuthRequest({
      clientId: googleClientId,
    });

  useEffect(() => {
    if (response?.type === "success") {
      const idToken = response.params?.id_token;
      if (!idToken) {
        Alert.alert("Google", "Missing id_token");
        return;
      }

      signInWithGoogle(idToken)
        .then(() => router.replace("/(tabs)"))
        .catch((e) => Alert.alert("Google", String(e)));
    }
  }, [response]);

  async function onSubmit() {
    try {
      await signIn(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("Sign in", String(e?.message ?? e));
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in</Text>

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
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={styles.primaryBtn} onPress={onSubmit}>
        <Text style={styles.primaryText}>Sign in</Text>
      </Pressable>

      <Link href="/(auth)/sign-up" asChild>
        <Pressable style={styles.linkBtn}>
          <Text style={styles.linkText}>Create an account</Text>
        </Pressable>
      </Link>

      {googleEnabled && (
        <Pressable
          disabled={!request}
          style={[styles.googleBtn, !request && { opacity: 0.5 }]}
          onPress={() => promptAsync({ useProxy: true })}
        >
          <Text style={styles.googleText}>Continue with Google</Text>
        </Pressable>
      )}

      {!googleEnabled && (
        <Text style={styles.hint}>
          Google disabled (missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID)
        </Text>
      )}
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
  googleBtn: { borderWidth: 1, padding: 12, borderRadius: 10, alignItems: "center" },
  googleText: { fontSize: 16, fontWeight: "600" },
  hint: { opacity: 0.6, textAlign: "center" },
});
