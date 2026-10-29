import { Inngest } from "inngest";

// Local development deliberately uses localhost:8288, even if cloud keys exist.
export const inngest = new Inngest({
  id: "app-prac",
  isDev: process.env.NODE_ENV !== "production",
});
