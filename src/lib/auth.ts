export const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
export const isClerkConfigured = Boolean(
  clerkPublishableKey && /^pk_(test|live)_/.test(clerkPublishableKey),
);
