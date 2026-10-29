// Imported only by API routes / server modules. Never use EXPO_PUBLIC_ for secrets.
export function requireServerEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing server environment variable: ${name}`);
  return value;
}
