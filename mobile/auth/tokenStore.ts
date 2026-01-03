import * as SecureStore from "expo-secure-store";
import type { Tokens } from "./api";

const ACCESS = "access_token";
const REFRESH = "refresh_token";

export async function saveTokens(t: Tokens) {
  await SecureStore.setItemAsync(ACCESS, t.access_token);
  await SecureStore.setItemAsync(REFRESH, t.refresh_token);
}

export async function loadTokens(): Promise<{ access?: string; refresh?: string }> {
  const access = await SecureStore.getItemAsync(ACCESS);
  const refresh = await SecureStore.getItemAsync(REFRESH);
  return { access: access ?? undefined, refresh: refresh ?? undefined };
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS);
  await SecureStore.deleteItemAsync(REFRESH);
}
