import { auth } from "$lib/auth"; // path to your auth file
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from '$app/environment'

console.log("AUTH PROVIDERS:", auth.options?.socialProviders);


export async function handle({ event, resolve }) {
    return svelteKitHandler({ event, resolve, auth, building });
}