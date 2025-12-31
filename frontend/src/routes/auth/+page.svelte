<script lang="ts">
  import { authClient } from "$lib/auth-client";

  async function signInGoogle() {
    await authClient.signIn.social({ provider: "google" });
  }

  async function signUpEmail(e: SubmitEvent) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const name = String(fd.get("name") || "");
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");
    const res = await authClient.signUp.email({ name, email, password });
    console.log(res);
    console.log("res");
    if ("error" in res && res.error) console.error(res.error);
  }


  async function signInEmail(e: SubmitEvent) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");
    await authClient.signIn.email({ email, password });
  }
</script>

<h1>Users</h1>

<button on:click={signInGoogle}>
  Continue with Google
</button>

<h2>Create user (email/password)</h2>
<form on:submit={signUpEmail}>
  <input name="email" type="email" placeholder="email" required />
  <input name="password" type="password" placeholder="password" required />
  <button type="submit">Create account</button>
</form>

<h2>Sign in</h2>
<form on:submit={signUpEmail}>
  <input name="name" type="text" placeholder="name" required />
  <input name="email" type="email" placeholder="email" required />
  <input name="password" type="password" placeholder="password" required />
  <button type="submit">Create account</button>
</form>

