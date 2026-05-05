/**
 * Dev mode flag — when VITE_CLERK_PUBLISHABLE_KEY is unset, the frontend
 * runs WITHOUT auth. This mirrors the backend's AUTH_REQUIRED=False default
 * so developers can run the app end-to-end without Clerk/Stripe configured.
 */
export const useDevMode = () => {
  const devMode = !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  return { devMode };
};
