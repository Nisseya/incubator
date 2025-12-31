import { createAuthClient } from "better-auth/svelte";
export const authClient = createAuthClient({
  baseURL: import.meta.env.PUBLIC_AUTH_URL,
});
